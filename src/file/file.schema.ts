import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import * as mongoose from 'mongoose';

import { User } from '../user/user.schema';

export type FileDocument = File & Document;

@Schema()
export class File {
  @Transform(({ value }) => value.toString())
  public _id: ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  @Type(() => User)
  public owner: User;

  @Prop()
  public fileName: string;

  @Prop()
  public size: number;

  @Prop()
  public mimetype: string;

  @Prop()
  public path: string;

  @Prop()
  public hash: string;

  @Prop()
  public uploadedAt: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);
