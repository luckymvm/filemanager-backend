import { ObjectId } from 'mongoose';
import { IsMongoId } from 'class-validator';

export class DownloadFile {
  @IsMongoId({ message: 'Invalid file id' })
  fileId: string;

  @IsMongoId({ message: 'Invalid user id' })
  userId: string;
}
