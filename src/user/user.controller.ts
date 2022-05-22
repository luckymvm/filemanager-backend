import { Body, Controller, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUser } from './dtos/createUser';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  createUser(@Body() credentials: CreateUser) {
    return this.userService.createUser(credentials);
  }
}