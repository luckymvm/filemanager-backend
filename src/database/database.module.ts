import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://user:1337@cluster0.7jyww.mongodb.net/?retryWrites=true&w=majority',
    ),
  ],
})
export class DatabaseModule {}
