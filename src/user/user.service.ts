import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './user.schema';
import { CreateUser } from './dto/createUser';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async createUser(credentials: CreateUser) {
    try {
      credentials.password = await hash(credentials.password, 10);
      const newUser = new this.userModel(credentials);
      await newUser.save();
      return { message: 'Successfully registered' };
    } catch (e) {
      throw new BadRequestException('The username or email are taken');
    }
  }

  async findOne(cond): Promise<User | null> {
    const findOne = await this.userModel.findOne(cond);
    return findOne;
  }

  async findById(id: string): Promise<User | null> {
    const findUser = await this.userModel.findById(id);
    if (!findUser) return null;
    return findUser;
  }
}
