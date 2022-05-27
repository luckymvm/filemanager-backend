import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { createReadStream, unlink } from 'fs';
import { createHash } from 'crypto';

import { File, FileDocument } from './file.schema';
import { SaveFile } from './dto/saveFile';
import { DownloadFile } from './dto/downloadFile';
import { UserFiles } from './interface/userFiles';
import { GetFile } from './interface/getFile';

@Injectable()
export class FileService {
  constructor(@InjectModel(File.name) private fileModel: Model<FileDocument>) {}

  public async pushFilesToDB(files: Express.Multer.File[], userId: ObjectId): Promise<UserFiles[]> {
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

    return this.buildResponse(fileList);
  }

  public async getFile(downloadFile: DownloadFile): Promise<GetFile> {
    let foundFile = await this.findFile(downloadFile.fileId);
    if (!foundFile) {
      throw new BadRequestException('File not found');
    } else if (downloadFile.userId !== foundFile.owner.toString()) {
      throw new BadRequestException('Permission denied');
    }
    try {
      const readStream = await createReadStream(foundFile.path);
      const streamableFile = new StreamableFile(readStream);
      return {
        streamableFile,
        size: foundFile.size,
        fileName: foundFile.fileName,
      };
    } catch (e) {
      throw new BadRequestException('File not found');
    }
  }

  public async delete(userId: string, fileId: string) {
    const foundFile = await this.findFile(fileId);
    if (!foundFile) {
      throw new BadRequestException('File not found');
    } else if (userId !== foundFile.owner.toString()) {
      throw new BadRequestException('Permission denied');
    }

    unlink(foundFile.path, () => {});
    await this.fileModel.findOneAndDelete({ _id: fileId });
    return { fileId, message: 'Successfully deleted' };
  }

  public async getAllUserFiles(userId: ObjectId): Promise<UserFiles[]> {
    const files = await this.fileModel.find({ owner: userId }).sort({ uploadedAt: -1 });
    return this.buildResponse(files);
  }

  private async findFile(fileId: string): Promise<File | null> {
    try {
      const foundFile = await this.fileModel.findOne({ _id: fileId });
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
      const saveToDB = await createModel.save();
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

  private buildResponse(files: File[]): UserFiles[] {
    return files.map((file) => ({
      fileId: file._id.toString(),
      fileName: file.fileName,
      size: file.size,
      uploadedAt: file.uploadedAt,
      hash: file.hash,
    }));
  }
}
