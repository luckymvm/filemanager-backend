import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class SaveToken {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsMongoId()
  userId: ObjectId;

  @IsString()
  @IsNotEmpty()
  browserId: string;

  @IsNumber()
  @IsNotEmpty()
  expiresIn: number;
}
