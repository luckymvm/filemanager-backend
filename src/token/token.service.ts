import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from '../user/user.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms from '../../helpers/ms';
import { InjectModel } from '@nestjs/mongoose';
import { Token, TokenDocument } from './token.schema';
import { Model } from 'mongoose';
import { SaveToken } from './dtos/saveToken';
import { OldtokenData } from './dtos/oldtokenData';

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async getNewAccessAndRefreshTokens(user: User, browserId: string) {
    const deleteOldToken = await this.tokenModel.findOneAndDelete({ browserId });

    const userId = user._id.toString();
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken();
    const refTokenExpTimeInMS = this.refTokenExpiresInMS();
    const saveToDB = {
      refreshToken,
      browserId,
      userId: user._id,
      expiresIn: Math.floor(new Date().getTime() / 1000),
    };
    await this.saveRefreshToken(saveToDB);

    return { accessToken, refTokenExpTimeInMS, ...saveToDB };
  }

  public async updateAccessAndRefreshTokens(user: User, oldToken: OldtokenData) {
    const findToken = await this.tokenModel.findOne({ refreshToken: oldToken.refreshToken });
    if (!findToken) {
      throw new BadRequestException('Refresh token not found');
    } else if (findToken.browserId !== oldToken.browserId) {
      await this.tokenModel.findOneAndDelete({ refreshToken: oldToken.refreshToken });
      throw new BadRequestException('Wrong browserId');
    }

    const nowTime = new Date().getTime() / 1000;
    if (nowTime >= findToken.expiresIn) {
      throw new BadRequestException('Refresh token expired');
    }

    return this.getNewAccessAndRefreshTokens(user, oldToken.browserId);
  }

  private async findAndDeleteRefreshToken(browserId: string) {
    return this.tokenModel.deleteMany({ browserId });
  }

  private async saveRefreshToken(token: SaveToken) {
    try {
      const newToken = new this.tokenModel(token);
      const savedToken = await newToken.save();
      return savedToken;
    } catch (e) {}
  }

  private generateRefreshToken() {
    return randomUUID();
  }

  private generateAccessToken(id: string) {
    return this.jwtService.signAsync({ sub: id });
  }

  private refTokenExpiresInMS() {
    const timeFromConfig = this.configService.get('REFRESH_TOKEN_EXPIRATION_TIME');
    return ms(timeFromConfig);
  }
}
