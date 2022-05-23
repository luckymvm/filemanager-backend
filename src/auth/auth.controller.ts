import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from '../token/token.service';
import { LocalGuard } from './guards/local.guard';
import { JwtGuard } from './guards/jwt.guard';
import { RequestWithUser } from './dtos/requestWithUser';
import { SignIn } from './dtos/signIn';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @UseGuards(LocalGuard)
  @Post('login')
  async login(@Req() req: RequestWithUser, @Body() signIn: SignIn, @Res() res: Response) {
    const user = req.user;
    const tokens = await this.tokenService.getNewAccessAndRefreshTokens(user, signIn.browserId);
    res.cookie('refreshToken', tokens.refreshToken, {
      maxAge: tokens.refTokenExpTimeInMS,
      httpOnly: true,
    });
    return res.send({ accessToken: tokens.accessToken });
  }

  @UseGuards(JwtGuard)
  @Post('refresh')
  async refresh(@Req() req: RequestWithUser, @Res() res: Response) {}

  @UseGuards(JwtGuard)
  @Post('refresh')
  async logout() {}

  @UseGuards(JwtGuard)
  @Get()
  getUser(@Req() req: RequestWithUser) {}
}
