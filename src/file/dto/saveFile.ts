import { IsDate, IsMongoId, IsNumber, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class SaveFile {
  @IsMongoId()
  owner: ObjectId;

  @IsString()
  fileName: string;

  @IsString()
  path: string;

  @IsNumber()
  size: number;

  @IsString()
  mimetype: string;

  @IsString()
  hash: string;

  @IsDate()
  uploadedAt: Date;
}
