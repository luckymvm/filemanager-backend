import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { UserService } from './user.service';
import { CreateUser } from './dto/createUser';
import { RequestWithUser } from '../auth/dto/requestWithUser';
import { JwtGuard } from '../auth/guard/jwt.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  createUser(@Body() credentials: CreateUser) {
    return this.userService.createUser(credentials);
  }

  @UseGuards(JwtGuard)
  @Post('generate-api-key')
  generateNewApiKey(@Req() req: RequestWithUser) {
    return this.userService.generateNewApiKey(req.user._id.toString());
  }

  @UseGuards(JwtGuard)
  @Get('get-api-key')
  getApiKey(@Req() req: RequestWithUser) {
    return req.user.apiKey;
  }

  @UseGuards(JwtGuard)
  @Patch('toggle-api-key-access')
  toggleApiKey(@Req() req: RequestWithUser) {
    return this.userService.toggleApiKey(req.user);
  }

  @Post('reset-password')
  resetPassword() {}
}
