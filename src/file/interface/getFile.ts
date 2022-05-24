import { StreamableFile } from '@nestjs/common';

export interface GetFile {
  streamableFile: StreamableFile;
  fileName: string;
}
