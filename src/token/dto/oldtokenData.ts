import { IsNotEmpty } from 'class-validator';

export class OldtokenData {
  @IsNotEmpty({ message: 'Refresh token not provided' })
  refreshToken: string;

  @IsNotEmpty({ message: 'BrowserId not provided' })
  browserId: string;
}
