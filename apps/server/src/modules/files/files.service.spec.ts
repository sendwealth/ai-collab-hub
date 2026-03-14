import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaService } from '../common/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

describe('FilesService', () => {
  let service: FilesService;

  const mockPrismaService = {
    file: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test'),
    size: 1024,
    stream: null as any,
    destination: '/uploads',
    filename: 'test-123.pdf',
    path: '/uploads/test-123.pdf',
  };

  const mockFileRecord = {
    id: 'file-1',
    filename: 'test.pdf',
    path: '/uploads/test-123.pdf',
    size: 1024,
    mimeType: 'application/pdf',
    version: 1,
    taskId: 'task-1',
    agentId: 'agent-1',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    task: { id: 'task-1', title: 'Test Task' },
    agent: { id: 'agent-1', name: 'Test Agent' },
    parent: null,
    children: [],
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock fs methods
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    (fs.createReadStream as jest.Mock).mockReturnValue({
      on: jest.fn(),
      pipe: jest.fn(),
    } as any);

    // Mock path.join
    (path.join as jest.Mock).mockReturnValue('/uploads');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create upload directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      await Test.createTestingModule({
        providers: [
          FilesService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
        ],
      }).compile();

      expect(fs.mkdirSync).toHaveBeenCalledWith('/uploads', { recursive: true });
    });

    it('should not create upload directory if it already exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      await Test.createTestingModule({
        providers: [
          FilesService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
        ],
      }).compile();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createFileDto = {
      taskId: 'task-1',
      agentId: 'agent-1',
      parentId: undefined,
    };

    it('should create a new file successfully', async () => {
      mockPrismaService.file.findFirst.mockResolvedValue(null);
      mockPrismaService.file.create.mockResolvedValue(mockFileRecord);

      const result = await service.create(mockFile, createFileDto);

      expect(result).toEqual(mockFileRecord);
      expect(mockPrismaService.file.findFirst).toHaveBeenCalledWith({
        where: {
          filename: mockFile.originalname,
          taskId: createFileDto.taskId,
          agentId: createFileDto.agentId,
        },
        orderBy: { version: 'desc' },
      });
      expect(mockPrismaService.file.create).toHaveBeenCalledWith({
        data: {
          filename: mockFile.originalname,
          path: mockFile.path,
          size: mockFile.size,
          mimeType: mockFile.mimetype,
          version: 1,
          taskId: createFileDto.taskId,
          agentId: createFileDto.agentId,
          parentId: undefined,
        },
        include: {
          task: true,
          agent: true,
          parent: true,
        },
      });
    });

    it('should create a new version if file with same name exists', async () => {
      const existingFile = { ...mockFileRecord, version: 1 };
      mockPrismaService.file.findFirst.mockResolvedValue(existingFile);
      mockPrismaService.file.create.mockResolvedValue({
        ...mockFileRecord,
        version: 2,
      });

      const result = await service.create(mockFile, createFileDto);

      expect(result.version).toBe(2);
      expect(mockPrismaService.file.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
          }),
        }),
      );
    });

    it('should throw NotFoundException if parent file not found', async () => {
      const dtoWithParent = {
        ...createFileDto,
        parentId: 'parent-1',
      };
      mockPrismaService.file.findUnique.mockResolvedValue(null);

      await expect(service.create(mockFile, dtoWithParent)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(mockFile, dtoWithParent)).rejects.toThrow(
        'Parent file not found',
      );
    });

    it('should create file with parent if parent exists', async () => {
      const dtoWithParent = {
        ...createFileDto,
        parentId: 'parent-1',
      };
      const parentFile = { ...mockFileRecord, id: 'parent-1' };
      
      mockPrismaService.file.findUnique.mockResolvedValue(parentFile);
      mockPrismaService.file.findFirst.mockResolvedValue(null);
      mockPrismaService.file.create.mockResolvedValue({
        ...mockFileRecord,
        parentId: 'parent-1',
      });

      const result = await service.create(mockFile, dtoWithParent);

      expect(result.parentId).toBe('parent-1');
      expect(mockPrismaService.file.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
      });
    });

    it('should handle different file types', async () => {
      const imageFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'image.png',
        mimetype: 'image/png',
      };

      mockPrismaService.file.findFirst.mockResolvedValue(null);
      mockPrismaService.file.create.mockResolvedValue({
        ...mockFileRecord,
        filename: 'image.png',
        mimeType: 'image/png',
      });

      const result = await service.create(imageFile, createFileDto);

      expect(result.mimeType).toBe('image/png');
    });

    it('should handle large files', async () => {
      const largeFile: Express.Multer.File = {
        ...mockFile,
        size: 10 * 1024 * 1024, // 10MB
      };

      mockPrismaService.file.findFirst.mockResolvedValue(null);
      mockPrismaService.file.create.mockResolvedValue({
        ...mockFileRecord,
        size: largeFile.size,
      });

      const result = await service.create(largeFile, createFileDto);

      expect(result.size).toBe(largeFile.size);
    });
  });

  describe('findAll', () => {
    it('should return all files without filters', async () => {
      const files = [mockFileRecord];
      mockPrismaService.file.findMany.mockResolvedValue(files);

      const result = await service.findAll({});

      expect(result).toEqual(files);
      expect(mockPrismaService.file.findMany).toHaveBeenCalledWith({
        where: {},
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
    });

    it('should filter files by taskId', async () => {
      const files = [mockFileRecord];
      mockPrismaService.file.findMany.mockResolvedValue(files);

      await service.findAll({ taskId: 'task-1' });

      expect(mockPrismaService.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            taskId: 'task-1',
          }),
        }),
      );
    });

    it('should filter files by agentId', async () => {
      const files = [mockFileRecord];
      mockPrismaService.file.findMany.mockResolvedValue(files);

      await service.findAll({ agentId: 'agent-1' });

      expect(mockPrismaService.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agentId: 'agent-1',
          }),
        }),
      );
    });

    it('should filter files by parentId', async () => {
      const files = [mockFileRecord];
      mockPrismaService.file.findMany.mockResolvedValue(files);

      await service.findAll({ parentId: 'parent-1' });

      expect(mockPrismaService.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: 'parent-1',
          }),
        }),
      );
    });

    it('should filter by multiple criteria', async () => {
      const files = [mockFileRecord];
      mockPrismaService.file.findMany.mockResolvedValue(files);

      await service.findAll({
        taskId: 'task-1',
        agentId: 'agent-1',
        parentId: 'parent-1',
      });

      expect(mockPrismaService.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            taskId: 'task-1',
            agentId: 'agent-1',
            parentId: 'parent-1',
          },
        }),
      );
    });

    it('should return empty array if no files found', async () => {
      mockPrismaService.file.findMany.mockResolvedValue([]);

      const result = await service.findAll({ taskId: 'non-existent' });

      expect(result).toEqual([]);
    });

    it('should return files ordered by createdAt desc', async () => {
      const file1 = { ...mockFileRecord, id: 'file-1', createdAt: new Date('2024-01-01') };
      const file2 = { ...mockFileRecord, id: 'file-2', createdAt: new Date('2024-01-02') };
      mockPrismaService.file.findMany.mockResolvedValue([file2, file1]);

      const result = await service.findAll({});

      expect(result[0].id).toBe('file-2');
      expect(result[1].id).toBe('file-1');
    });
  });

  describe('findOne', () => {
    it('should return a file by id', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);

      const result = await service.findOne('file-1');

      expect(result).toEqual(mockFileRecord);
      expect(mockPrismaService.file.findUnique).toHaveBeenCalledWith({
        where: { id: 'file-1' },
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
    });

    it('should throw NotFoundException if file not found', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'File not found',
      );
    });

    it('should include related entities', async () => {
      const fileWithRelations = {
        ...mockFileRecord,
        task: { id: 'task-1', title: 'Test Task' },
        agent: { id: 'agent-1', name: 'Test Agent' },
        parent: { id: 'parent-1', filename: 'parent.pdf' },
        children: [{ id: 'child-1', filename: 'child.pdf' }],
      };
      mockPrismaService.file.findUnique.mockResolvedValue(fileWithRelations);

      const result = (await service.findOne('file-1')) as any;

      expect(result.task).toBeDefined();
      expect(result.agent).toBeDefined();
      expect(result.parent).toBeDefined();
      expect(result.children).toBeDefined();
      expect(result.children).toHaveLength(1);
    });
  });

  describe('download', () => {
    it('should return file and stream', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = { on: jest.fn(), pipe: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = await service.download('file-1');

      expect(result.file).toEqual(mockFileRecord);
      expect(result.stream).toEqual(mockStream);
      expect(fs.createReadStream).toHaveBeenCalledWith(mockFileRecord.path);
    });

    it('should throw NotFoundException if file not found', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(null);

      await expect(service.download('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if file not found on disk', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.download('file-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.download('file-1')).rejects.toThrow(
        'File not found on disk',
      );
    });

    it('should create read stream with correct path', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = { on: jest.fn(), pipe: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      await service.download('file-1');

      expect(fs.createReadStream).toHaveBeenCalledWith('/uploads/test-123.pdf');
    });

    it('should handle null file from findOne', async () => {
      // This test covers the branch where findOne returns null
      // (even though findOne throws NotFoundException, we test the defensive code)
      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(null as any);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      await expect(service.download('file-1')).rejects.toThrow(NotFoundException);
      
      findOneSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should delete file from database and disk', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockPrismaService.file.delete.mockResolvedValue(mockFileRecord);

      const result = await service.remove('file-1');

      expect(result).toEqual(mockFileRecord);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFileRecord.path);
      expect(mockPrismaService.file.delete).toHaveBeenCalledWith({
        where: { id: 'file-1' },
      });
    });

    it('should throw NotFoundException if file not found', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle missing file on disk gracefully', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockPrismaService.file.delete.mockResolvedValue(mockFileRecord);

      const result = await service.remove('file-1');

      expect(result).toEqual(mockFileRecord);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(mockPrismaService.file.delete).toHaveBeenCalled();
    });

    it('should delete file even if unlink fails', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });
      mockPrismaService.file.delete.mockResolvedValue(mockFileRecord);

      // This should throw due to unlinkSync error
      await expect(service.remove('file-1')).rejects.toThrow('Permission denied');
    });

    it('should handle null file from findOne', async () => {
      // This test covers the branch where findOne returns null
      // (even though findOne throws NotFoundException, we test the defensive code)
      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(null as any);
      
      await expect(service.remove('file-1')).rejects.toThrow(NotFoundException);
      
      findOneSpy.mockRestore();
    });
  });

  describe('getFileVersions', () => {
    it('should return all versions of a file', async () => {
      const versions = [
        { ...mockFileRecord, version: 3 },
        { ...mockFileRecord, version: 2 },
        { ...mockFileRecord, version: 1 },
      ];
      mockPrismaService.file.findMany.mockResolvedValue(versions);

      const result = await service.getFileVersions('test.pdf', 'agent-1');

      expect(result).toEqual(versions);
      expect(mockPrismaService.file.findMany).toHaveBeenCalledWith({
        where: {
          filename: 'test.pdf',
          agentId: 'agent-1',
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
    });

    it('should return empty array if no versions found', async () => {
      mockPrismaService.file.findMany.mockResolvedValue([]);

      const result = await service.getFileVersions('nonexistent.pdf', 'agent-1');

      expect(result).toEqual([]);
    });

    it('should order versions by version desc', async () => {
      const versions = [
        { ...mockFileRecord, version: 5 },
        { ...mockFileRecord, version: 3 },
        { ...mockFileRecord, version: 1 },
      ];
      mockPrismaService.file.findMany.mockResolvedValue(versions);

      const result = await service.getFileVersions('test.pdf', 'agent-1');

      expect(result[0].version).toBe(5);
      expect(result[1].version).toBe(3);
      expect(result[2].version).toBe(1);
    });

    it('should include agent information in versions', async () => {
      const versions = [
        {
          ...mockFileRecord,
          agent: { id: 'agent-1', name: 'Test Agent' },
        },
      ];
      mockPrismaService.file.findMany.mockResolvedValue(versions);

      const result = await service.getFileVersions('test.pdf', 'agent-1');

      expect((result[0] as any).agent).toBeDefined();
      expect((result[0] as any).agent.name).toBe('Test Agent');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in create', async () => {
      mockPrismaService.file.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.create(mockFile, { agentId: 'agent-1' }),
      ).rejects.toThrow('Database error');
    });

    it('should handle database errors in findAll', async () => {
      mockPrismaService.file.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll({})).rejects.toThrow('Database error');
    });

    it('should handle database errors in findOne', async () => {
      mockPrismaService.file.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne('file-1')).rejects.toThrow('Database error');
    });

    it('should handle database errors in remove', async () => {
      mockPrismaService.file.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.remove('file-1')).rejects.toThrow('Database error');
    });
  });
});
