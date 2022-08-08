import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { RequestWithUser } from '../auth/dto/requestWithUser';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { FileService } from './file.service';
import { UserFiles } from './interface/userFiles';
import { createReadStream } from 'fs';
import { JwtAndApiKeyGuard } from '../auth/guard/jwtAndApiKey.guard';

@Controller('file')
@UseGuards(JwtAndApiKeyGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseInterceptors(FilesInterceptor('files'))
  @Post('upload')
  upload(
    @Req() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UserFiles[] | UserFiles> {
    const userId = req.user._id;
    return this.fileService.pushFilesToDB(files, userId);
  }

  @Get('download/:id')
  async download(
    @Req() req: RequestWithUser,
    @Param('id') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user._id.toString();
    const file = await this.fileService.getFile({ userId, fileId });
    const stream = createReadStream(file.path);
    stream.on('error', () => {
      res.status(400).send({ message: 'File not found' }).end();
    });

    res.set({
      'Content-Disposition': `attachment; filename="${encodeURI(file.fileName)}"`,
      'Content-Length': file.size,
    });
    return new StreamableFile(stream);
  }

  @Delete('delete/:id')
  async delete(@Req() req: RequestWithUser, @Param('id') fileId: string) {
    const userId = req.user._id.toString();
    return this.fileService.delete(userId, fileId);
  }

  @Patch('rename/:id')
  async rename(@Req() req: RequestWithUser, @Param('id') fileId: string) {
    const userId = req.user._id.toString();
    const { newFileName } = req.body;
    return this.fileService.rename({ userId, fileId, newFileName });
  }

  @Get()
  getUserFiles(@Req() req: RequestWithUser, @Query() query): Promise<UserFiles[] | UserFiles> {
    const { searchQuery } = query;
    delete query.searchQuery;
    return this.fileService.getAllUserFiles(req.user._id, query, searchQuery);
  }
}
