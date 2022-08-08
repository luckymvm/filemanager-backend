import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './user.schema';
import { CreateUser } from './dto/createUser';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  public async createUser(credentials: CreateUser) {
    try {
      credentials.password = await hash(credentials.password, 10);
      const newUser = new this.userModel(credentials);
      newUser.apiKey = randomUUID();
      await newUser.save();
      return { message: 'Successfully registered' };
    } catch (e) {
      throw new BadRequestException('The username or email are taken');
    }
  }

  public async generateNewApiKey(userId: string) {
    const newApiKey = randomUUID();
    const updated = await this.userModel.findOneAndUpdate(
      { _id: userId },
      { apiKey: newApiKey },
      { new: true },
    );

    return { apiKey: newApiKey };
  }

  public async toggleApiKey(user: User) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      { _id: user._id },
      { isApiKeyEnabled: !user.isApiKeyEnabled },
      { new: true },
    );

    return { message: '1' };
  }

  public async findOne(cond: object): Promise<User | null> {
    const findOne = await this.userModel.findOne(cond);
    return findOne;
  }

  public async findById(id: string): Promise<User | null> {
    const findUser = await this.userModel.findById(id);
    if (!findUser) return null;
    return findUser;
  }
}
