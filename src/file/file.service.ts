import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { File, FileDocument } from './file.schema';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SaveFile } from './dto/saveFile';
import { createHash } from 'crypto';
import { createReadStream, readFile, readFileSync, unlink } from 'fs';
import { DownloadFile } from './dto/downloadFile';
import { UserFiles } from './interface/userFiles';
import { GetFile } from './interface/getFile';

@Injectable()
export class FileService {
  constructor(@InjectModel(File.name) private fileModel: Model<FileDocument>) {}

  public async pushFilesToDB(files: Express.Multer.File[], userId: ObjectId): Promise<UserFiles[]> {
    let fileList = [];
    for (const file of files) {
      const fileBuffer = readFileSync(file.path);
      const hash = createHash('md5');
      hash.update(fileBuffer);
      const md5 = hash.digest('hex');

      let savedFile = await this.saveModel({
        owner: userId,
        fileName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
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
    const readedStream = createReadStream(foundFile.path);
    const streamableFile = new StreamableFile(readedStream);

    return {
      streamableFile,
      fileName: foundFile.fileName,
    };
  }

  public async delete(userId: string, fileId: string) {
    const foundFile = await this.findFile(fileId);
    if (!foundFile) {
      throw new BadRequestException('File not found');
    } else if (userId !== foundFile.owner.toString()) {
      throw new BadRequestException('Permission denied');
    }
    unlink(foundFile.path, (e) => console.log(e));
    await this.fileModel.findOneAndDelete({ _id: fileId });

    return { message: 'File successfully deleted' };
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
