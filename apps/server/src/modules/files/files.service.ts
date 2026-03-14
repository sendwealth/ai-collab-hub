import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFileDto, FileQueryDto } from './dto/create-file.dto';
import { File } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(
    file: Express.Multer.File,
    createFileDto: CreateFileDto,
  ): Promise<File> {
    const { taskId, agentId, parentId } = createFileDto;

    // Check if parent file exists (if provided)
    if (parentId) {
      const parent = await this.prisma.file.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent file not found');
      }
    }

    // Check for existing file with same name to create version
    const existingFile = await this.prisma.file.findFirst({
      where: {
        filename: file.originalname,
        taskId,
        agentId,
      },
      orderBy: { version: 'desc' },
    });

    const version = existingFile ? existingFile.version + 1 : 1;

    // Save file to database
    const savedFile = await this.prisma.file.create({
      data: {
        filename: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        version,
        taskId,
        agentId,
        parentId,
      },
      include: {
        task: true,
        agent: true,
        parent: true,
      },
    });

    return savedFile;
  }

  async findAll(query: FileQueryDto): Promise<File[]> {
    const { taskId, agentId, parentId } = query;

    return this.prisma.file.findMany({
      where: {
        ...(taskId && { taskId }),
        ...(agentId && { agentId }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        task: true,
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
            filename: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<File | null> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        task: true,
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: true,
        children: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async download(id: string): Promise<{ file: File; stream: fs.ReadStream }> {
    const file = await this.findOne(id);
    
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (!fs.existsSync(file.path)) {
      throw new NotFoundException('File not found on disk');
    }

    const stream = fs.createReadStream(file.path);

    return { file, stream };
  }

  async remove(id: string): Promise<File> {
    const file = await this.findOne(id);
    
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database (cascade will handle children)
    return this.prisma.file.delete({
      where: { id },
    });
  }

  async getFileVersions(filename: string, agentId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: {
        filename,
        agentId,
      },
      orderBy: { version: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
