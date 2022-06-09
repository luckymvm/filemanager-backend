import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, ObjectId } from 'mongoose';
import { Transform } from 'class-transformer';

import { User } from '../user/user.schema';

export type TokenDocument = Token & Document;

@Schema()
export class Token {
  public _id: ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  public owner: User;

  @Prop()
  public refreshToken: string;

  @Prop({ unique: true })
  public browserId: string;

  @Prop()
  public expiresIn: number;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
