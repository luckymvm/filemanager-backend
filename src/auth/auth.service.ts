import { BadRequestException, Injectable } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { compare } from 'bcrypt';

import { SignIn } from './dto/signIn';
import { UserService } from 'src/user/user.service';
import { User } from '../user/user.schema';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(cred: Omit<SignIn, 'browserId'>) {
    let user;
    if (isEmail(cred.username)) {
      user = { email: cred.username };
    } else {
      user = { username: cred.username };
    }

    const findUser = await this.userService.findOne(user);
    if (!findUser) throw new BadRequestException('Wrong username or password');

    const comparePasswords = await compare(cred.password, findUser.password);
    if (!comparePasswords) throw new BadRequestException('Wrong username or password');

    return findUser;
  }

  buildResponse(user: User, accessToken: string) {
    return {
      username: user.username,
      accessToken,
    };
  }
}
