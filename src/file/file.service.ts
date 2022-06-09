import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { createReadStream, read, unlink } from 'fs';
import { createHash } from 'crypto';

import { File, FileDocument } from './file.schema';
import { SaveFile } from './dto/saveFile';
import { DownloadFile } from './dto/downloadFile';
import { UserFiles } from './interface/userFiles';
import { GetFile } from './interface/getFile';
import { Response } from 'express';

@Injectable()
export class FileService {
  constructor(@InjectModel(File.name) private fileModel: Model<FileDocument>) {}

  public async pushFilesToDB(
    files: Express.Multer.File[],
    userId: ObjectId,
  ): Promise<UserFiles[] | UserFiles> {
    let fileList = [];
    for (const file of files) {
      const md5 = await this.getFileHash(file.path);
      const { originalname: fileName, path, size, mimetype } = file;

      let savedFile = await this.saveModel({
        fileName,
        path,
        size,
        mimetype,
        owner: userId,
        hash: md5,
        uploadedAt: new Date(),
      });

      fileList.push(savedFile);
    }

    return FileService.buildResponse(fileList);
  }

  public async getFile(downloadFile: DownloadFile) {
    let foundFile = await this.findFile(downloadFile.fileId);
    FileService.accessCheck(foundFile, downloadFile.userId);
    return foundFile;
    // try {
    //   return createReadStream(foundFile.path);
    // const streamableFile = new StreamableFile(readStream);
    // return {
    //   streamableFile,
    //   size: foundFile.size,
    //   fileName: foundFile.fileName,
    // };
    // } catch (e) {
    //   throw new BadRequestException('File not found');
    // }
  }

  public async delete(userId: string, fileId: string) {
    const foundFile = await this.findFile(fileId);
    FileService.accessCheck(foundFile, userId);

    unlink(foundFile.path, () => {});
    await this.fileModel.findOneAndDelete({ _id: fileId });
    return { fileId, message: 'Successfully deleted' };
  }

  public async rename(userId: string, fileId: string, newFileName: string) {
    if (!newFileName) {
      throw new BadRequestException('Provide new file name');
    }

    const foundFile = await this.findFile(fileId);
    FileService.accessCheck(foundFile, userId);
    if (foundFile.fileName === newFileName) {
      throw new BadRequestException('Old and new name are the same');
    }
    let renamedFile = await this.fileModel.findOneAndUpdate(
      { _id: fileId },
      { fileName: newFileName },
      { new: true },
    );

    return FileService.buildResponse(renamedFile);
  }

  public async getAllUserFiles(
    userId: ObjectId,
    sortCond: object = { uploadedAt: -1 },
    searchCond: string,
  ) {
    const files = await this.fileModel
      .find({ owner: userId, fileName: new RegExp(searchCond, 'i') })
      .sort(sortCond);
    return FileService.buildResponse(files);
  }

  private static accessCheck(file: File, userId: string) {
    if (!file) {
      throw new BadRequestException('File not found');
    } else if (userId !== file.owner.toString()) {
      throw new BadRequestException('Permission denied');
    }
  }

  private async findFile(fileId: string): Promise<File | null> {
    try {
      const foundFile = await this.fileModel.findOne({ _id: fileId }); // not redundant
      return foundFile;
    } catch (e) {
      if (e.name === 'CastError') {
        throw new BadRequestException('Invalid file id');
      }
      throw new BadRequestException(e.name);
    }
  }

  private async saveModel(file: SaveFile) {
    try {
      const createModel = new this.fileModel(file);
      const saveToDB = await createModel.save(); // not redundant
      return saveToDB;
    } catch (e) {}
  }

  private getFileHash(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileBuffer = createReadStream(path);
      const hash = createHash('md5');
      fileBuffer.on('error', (err) => reject(err));
      fileBuffer.on('data', (chunk) => hash.update(chunk));
      fileBuffer.on('end', () => resolve(hash.digest('hex')));
    });
  }

  readStream(path: string): Promise<Buffer | Error> {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(path);
      stream.on('error', (e) => reject(e));
      stream.on('data', (data) => resolve(data as Buffer));
    });
  }

  private static buildResponse(files: File[] | File): UserFiles[] | UserFiles {
    if (!Array.isArray(files)) {
      return {
        fileId: files._id.toString(),
        fileName: files.fileName,
        size: files.size,
        uploadedAt: files.uploadedAt,
        hash: files.hash,
      };
    }

    return files.map((file) => ({
      fileId: file._id.toString(),
      fileName: file.fileName,
      size: file.size,
      uploadedAt: file.uploadedAt,
      hash: file.hash,
    }));
  }
}
