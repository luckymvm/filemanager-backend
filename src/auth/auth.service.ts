import { BadRequestException, Injectable } from '@nestjs/common';
import { SignIn } from './dtos/signIn';
import { UserService } from '../user/user.service';
import { isEmail } from 'class-validator';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {}
