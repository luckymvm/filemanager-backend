import { Request } from 'express';
import { User } from '../../user/user.schema';

export interface RequestWithUser extends Request {
  user: User;
}
