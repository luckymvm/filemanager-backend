import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule, TokenModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
