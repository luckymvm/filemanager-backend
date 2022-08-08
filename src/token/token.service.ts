import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { randomUUID } from 'crypto';

import ms from '../../helpers/ms';
import { Token, TokenDocument } from './token.schema';
import { SaveToken } from './dto/saveToken';
import { OldRefreshSession } from './dto/oldRefreshSession';
import { NewTokens } from './interface/newTokens';
import { UserService } from '../user/user.service';
import { User } from '../user/user.schema';

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async getNewAccessAndRefreshTokens(browserId: string, user: User): Promise<NewTokens> {
    await this.tokenModel.findOneAndDelete({ browserId });

    const accessToken = await this.generateAccessToken(user._id);
    const refreshToken = TokenService.generateRefreshToken();
    const refTokenExpTimeInMS = this.refTokenExpiresInMS();
    const saveToDB = {
      refreshToken,
      browserId,
      owner: user._id,
      expiresIn: Math.floor((new Date().getTime() + refTokenExpTimeInMS) / 1000),
    };
    await this.saveRefreshToken(saveToDB);

    return { accessToken, refreshToken, refTokenExpTimeInMS, user };
  }

  public async updateAccessAndRefreshTokens(oldSession: OldRefreshSession): Promise<NewTokens> {
    if (!oldSession.refreshToken || !oldSession.browserId) {
      throw new BadRequestException('Refresh token or browserId not provided');
    }

    const foundToken = await this.tokenModel
      .findOne({ refreshToken: oldSession.refreshToken })
      .populate('owner');
    await this.validateFoundSession(foundToken, oldSession);

    return this.getNewAccessAndRefreshTokens(oldSession.browserId, foundToken.owner);
  }

  public async findAndDeleteRefreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token not provided');
    }
    return this.tokenModel.findOneAndDelete({ refreshToken });
  }

  private async validateFoundSession(tokenFromDB: Token, oldSession: OldRefreshSession) {
    if (!tokenFromDB) {
      throw new BadRequestException('Refresh token not found');
    } else if (tokenFromDB.browserId !== oldSession.browserId) {
      await this.tokenModel.findOneAndDelete({ refreshToken: oldSession.refreshToken });
      throw new BadRequestException('Wrong browserId');
    }
    TokenService.checkRefTokenForExpDate(tokenFromDB.expiresIn);
  }

  private async saveRefreshToken(token: SaveToken): Promise<Token> {
    try {
      const newToken = new this.tokenModel(token);
      await newToken.save();
      return newToken;
    } catch (e) {}
  }

  private static generateRefreshToken(): string {
    return randomUUID();
  }

  private generateAccessToken(id: ObjectId): Promise<string> {
    return this.jwtService.signAsync({ sub: id.toString() });
  }

  private static checkRefTokenForExpDate(expiresIn: number): boolean {
    const nowTime = Math.floor(new Date().getTime() / 1000);
    if (nowTime >= expiresIn) {
      throw new BadRequestException('Refresh token expired');
    }
    return true;
  }

  private refTokenExpiresInMS(): number {
    const timeFromConfig = this.configService.get('REFRESH_TOKEN_EXPIRATION_TIME');
    return ms(timeFromConfig);
  }
}
