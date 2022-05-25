import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveToken {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsString()
  @IsNotEmpty()
  browserId: string;

  @IsNumber()
  @IsNotEmpty()
  expiresIn: number;
}
