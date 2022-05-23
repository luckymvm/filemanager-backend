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
    return res.send(this.authService.buildResponse(user, tokens.accessToken));
  }

  @UseGuards(JwtGuard)
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithUser,
    @Body('browserId') browserId: string,
    @Res() res: Response,
  ) {
    const user = req.user;
    const refreshToken = req.cookies.refreshToken;
    const newTokens = await this.tokenService.updateAccessAndRefreshTokens(user, {
      refreshToken,
      browserId,
    });

    res.cookie('refreshToken', newTokens.refreshToken, {
      maxAge: newTokens.refTokenExpTimeInMS,
      httpOnly: true,
    });
    return res.send(this.authService.buildResponse(user, newTokens.accessToken));
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  async logout(@Req() req: RequestWithUser, @Res() res: Response) {
    await this.tokenService.findAndDeleteRefreshToken(req.cookies.refreshToken);
    res.cookie('refreshToken', '', {
      maxAge: 0,
      httpOnly: true,
    });
    return res.send();
  }

  @UseGuards(JwtGuard)
  @Get()
  getUser(@Req() req: RequestWithUser) {
    const user = req.user;
    return { username: user.username };
  }
}
