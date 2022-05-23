import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SignIn {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toString())
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  browserId: string;
}
