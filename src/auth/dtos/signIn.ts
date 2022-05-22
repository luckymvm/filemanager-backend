import { IsNotEmpty, IsString } from 'class-validator';

export class SignIn {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
