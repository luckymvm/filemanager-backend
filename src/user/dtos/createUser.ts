import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUser {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toString())
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
