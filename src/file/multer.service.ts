import { Injectable } from '@nestjs/common';
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { RequestWithUser } from '../auth/dto/requestWithUser';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

@Injectable()
export class MulterService implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  async createMulterOptions(): Promise<MulterModuleOptions> {
    return {
      storage: diskStorage({
        destination: this.destination,
        filename: this.filename,
      }),
      limits: {
        fieldSize: 6233689215,
        fileSize: 6233689215,
      },
    };
  }

  async destination(
    req: RequestWithUser,
    file: Express.Multer.File,
    callback: (error: Error | null, path: string) => void,
  ) {
    const ownerId = req.user._id.toString();
    const path = `./files/${ownerId}`;
    const pathExist = existsSync(path);
    if (!pathExist) {
      await mkdir(path);
    }
    callback(null, path);
  }

  filename(
    req: RequestWithUser,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) {
    const randomName = randomUUID() + extname(file.originalname);
    callback(null, randomName);
  }
}
