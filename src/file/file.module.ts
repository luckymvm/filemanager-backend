import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MulterService } from './multer.service';
import { File, FileSchema } from './file.schema';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useClass: MulterService,
    }),
    ConfigModule,
    UserModule,
    TokenModule,
  ],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
