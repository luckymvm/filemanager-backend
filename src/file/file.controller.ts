import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(JwtGuard)
  @Post('upload')
  upload(
    @Req() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UserFiles[] | UserFiles> {
    const userId = req.user._id;
    return this.fileService.pushFilesToDB(files, userId);
  }

  @UseGuards(JwtGuard)
  @Get('download/:id')
  async download(
    @Req() req: RequestWithUser,
    @Param('id') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const userId = req.user._id.toString();
    const file = await this.fileService.getFile({ userId, fileId });
    res.set({
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
      'Content-Length': file.size,
    });
    return file.streamableFile;
  }

  @UseGuards(JwtGuard)
  @Delete('delete/:id')
  async delete(@Req() req: RequestWithUser, @Param('id') fileId: string) {
    const userId = req.user._id.toString();
    return this.fileService.delete(userId, fileId);
  }

  @UseGuards(JwtGuard)
  @Patch('rename/:id')
  async rename(@Req() req: RequestWithUser, @Param('id') fileId: string) {
    const userId = req.user._id.toString();
    const { newFileName } = req.body;
    return this.fileService.rename(userId, fileId, newFileName);
  }

  @UseGuards(JwtGuard)
  @Get()
  getUserFiles(@Req() req: RequestWithUser): Promise<UserFiles[] | UserFiles> {
    return this.fileService.getAllUserFiles(req.user._id);
  }
}
