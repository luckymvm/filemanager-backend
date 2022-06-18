import { ObjectId } from 'mongoose';

export interface SaveFile {
  owner: ObjectId;
  fileName: string;
  path: string;
  size: number;
  mimetype: string;
  hash: string;
  uploadedAt: Date;
}
