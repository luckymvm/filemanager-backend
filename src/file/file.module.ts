import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MulterService } from './multer.service';
import { File, FileSchema } from './file.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useClass: MulterService,
    }),
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
