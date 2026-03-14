import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Header,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { CreateFileDto, FileQueryDto } from './dto/create-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query() createFileDto: CreateFileDto,
  ) {
    if (!file) {
      return {
        success: false,
        error: 'No file uploaded',
      };
    }

    const savedFile = await this.filesService.create(file, createFileDto);

    return {
      success: true,
      data: {
        id: savedFile.id,
        filename: savedFile.filename,
        size: savedFile.size,
        mimeType: savedFile.mimeType,
        version: savedFile.version,
        createdAt: savedFile.createdAt,
        agent: (savedFile as any).agent,
      },
    };
  }

  @Get()
  async findAll(@Query() query: FileQueryDto) {
    const files = await this.filesService.findAll(query);

    return {
      success: true,
      data: files.map((file: any) => ({
        id: file.id,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimeType,
        version: file.version,
        createdAt: file.createdAt,
        agent: file.agent,
        task: file.task,
        parent: file.parent,
        childrenCount: file._count?.children || 0,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const file = await this.filesService.findOne(id);

    return {
      success: true,
      data: {
        ...file,
        childrenCount: (file as any).children?.length || 0,
      },
    };
  }

  @Get(':id/download')
  @Header('Content-Type', 'application/octet-stream')
  async download(@Param('id') id: string) {
    const { file, stream } = await this.filesService.download(id);

    // Convert stream to buffer for StreamableFile
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      success: true,
      data: {
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        buffer: buffer.toString('base64'),
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Get('versions/:filename')
  async getFileVersions(
    @Param('filename') filename: string,
    @Query('agentId') agentId: string,
  ) {
    const versions = await this.filesService.getFileVersions(
      filename,
      agentId,
    );

    return {
      success: true,
      data: versions,
    };
  }
}
