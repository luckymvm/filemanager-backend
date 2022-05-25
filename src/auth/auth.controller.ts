import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from '../token/token.service';
import { LocalGuard } from './guard/local.guard';
import { JwtGuard } from './guard/jwt.guard';
import { RequestWithUser } from './dto/requestWithUser';
import { SignIn } from './dto/signIn';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @UseGuards(LocalGuard)
  @Post('login')
  async login(
    @Req() req: RequestWithUser,
    @Body() signIn: SignIn,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user._id.toString();
    const tokens = await this.tokenService.getNewAccessAndRefreshTokens(signIn.browserId, userId);
    res.cookie('refreshToken', tokens.refreshToken, {
      maxAge: tokens.refTokenExpTimeInMS,
      httpOnly: true,
    });
    return this.authService.buildResponse(req.user, tokens.accessToken);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body('browserId') browserId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    const newTokens = await this.tokenService.updateAccessAndRefreshTokens({
      refreshToken,
      browserId,
    });

    res.cookie('refreshToken', newTokens.refreshToken, {
      maxAge: newTokens.refTokenExpTimeInMS,
      httpOnly: true,
    });
    return { accessToken: newTokens.accessToken };
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
