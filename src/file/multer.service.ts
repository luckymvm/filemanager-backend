import { Injectable } from '@nestjs/common';
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

import { RequestWithUser } from '../auth/dto/requestWithUser';

@Injectable()
export class MulterService implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  async createMulterOptions(): Promise<MulterModuleOptions> {
    return {
      storage: diskStorage({
        destination: this.destination.bind(this),
        filename: this.filename,
      }),
    };
  }

  async destination(
    req: RequestWithUser,
    file: Express.Multer.File,
    callback: (error: Error | null, path: string) => void,
  ) {
    const ownerId = req.user._id.toString();
    const filesPath = this.configService.get('FILES_PATH');
    const paths = [filesPath, `${filesPath}/${ownerId}`];
    for (const path of paths) {
      const pathExist = existsSync(path);
      if (!pathExist) {
        await mkdir(path);
      }
    }
    callback(null, paths[1]);
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
