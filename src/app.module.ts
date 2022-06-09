import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    TokenModule,
    ConfigModule.forRoot(),
    FileModule,
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '../..', 'build'),
    // }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
