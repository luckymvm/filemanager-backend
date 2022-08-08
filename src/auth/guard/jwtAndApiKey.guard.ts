import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RequestWithUser } from '../dto/requestWithUser';
import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.schema';

@Injectable()
export class JwtAndApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    if (!(req.headers.authorization || req.headers['x-api-key'])) {
      throw new UnauthorizedException('From custom guard');
    }

    const token = req.headers.authorization;
    const verifyToken = await this.verifyJwt(token);
    if (verifyToken) {
      req.user = verifyToken;
      return true;
    }

    const apiKey = req.headers['x-api-key'] as string;
    const verifyApiKey = await this.verifyApiKey(apiKey);
    if (verifyApiKey) {
      req.user = verifyApiKey;
      return true;
    }

    throw new UnauthorizedException();
  }

  async verifyJwt(token: string) {
    try {
      const jwtSecret = this.configService.get('JWT_ACCESS_SECRET');
      const withoutBearer = token.split(' ')[1];
      const { sub } = verify(withoutBearer, jwtSecret);
      return this.userService.findById(sub.toString());
    } catch (e) {
      return null;
    }
  }

  async verifyApiKey(apiKey: string): Promise<User | null> {
    if (!apiKey) return null;
    const user = await this.userService.findOne({ apiKey });
    if (!user) return null;
    if (!user.isApiKeyEnabled) return null;

    return user;
  }
}
