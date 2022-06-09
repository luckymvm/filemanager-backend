import { Injectable } from '@nestjs/common';
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { mkdir, unlink } from 'fs/promises';

import { RequestWithUser } from '../auth/dto/requestWithUser';

@Injectable()
export class MulterService implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  async createMulterOptions(): Promise<MulterModuleOptions> {
    return {
      storage: diskStorage({
        destination: this.destination.bind(this),
        filename: this.filename.bind(this),
      }),
      limits: {
        fileSize: 5368709120,
      },
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
    const filesPath = this.configService.get('FILES_PATH');
    const randomName = randomUUID() + extname(file.originalname);
    callback(null, randomName);

    req.on('aborted', () => {
      const filePath = join(filesPath, req.user._id.toString(), randomName);
      file.stream.on('end', () => unlink(filePath));
      file.stream.emit('end');
    });
  }
}
