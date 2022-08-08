import { User } from '../../user/user.schema';

export interface NewTokens {
  accessToken: string;
  refreshToken: string;
  refTokenExpTimeInMS: number;
  user: User;
}
