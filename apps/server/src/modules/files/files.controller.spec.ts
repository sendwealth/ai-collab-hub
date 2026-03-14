import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { NotFoundException } from '@nestjs/common';

describe('FilesController', () => {
  let controller: FilesController;

  const mockFilesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
    getFileVersions: jest.fn(),
  };

  const mockFile = {
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

  const mockMulterFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test content'),
    size: 1024,
    stream: null as any,
    destination: '/uploads',
    filename: 'test-123.pdf',
    path: '/uploads/test-123.pdf',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    const createFileDto = {
      taskId: 'task-1',
      agentId: 'agent-1',
    };

    it('should upload a file successfully', async () => {
      mockFilesService.create.mockResolvedValue(mockFile);

      const result = await controller.uploadFile(mockMulterFile, createFileDto);

      expect(result).toEqual({
        success: true,
        data: {
          id: mockFile.id,
          filename: mockFile.filename,
          size: mockFile.size,
          mimeType: mockFile.mimeType,
          version: mockFile.version,
          createdAt: mockFile.createdAt,
          agent: mockFile.agent,
        },
      });
      expect(mockFilesService.create).toHaveBeenCalledWith(
        mockMulterFile,
        createFileDto,
      );
    });

    it('should return error if no file uploaded', async () => {
      const result = await controller.uploadFile(null as any, createFileDto);

      expect(result).toEqual({
        success: false,
        error: 'No file uploaded',
      });
      expect(mockFilesService.create).not.toHaveBeenCalled();
    });

    it('should handle file upload with parentId', async () => {
      const dtoWithParent = {
        ...createFileDto,
        parentId: 'parent-1',
      };
      mockFilesService.create.mockResolvedValue({
        ...mockFile,
        parentId: 'parent-1',
      });

      const result = await controller.uploadFile(mockMulterFile, dtoWithParent);

      expect(result.success).toBe(true);
      expect(mockFilesService.create).toHaveBeenCalledWith(
        mockMulterFile,
        dtoWithParent,
      );
    });

    it('should handle large file upload', async () => {
      const largeFile: Express.Multer.File = {
        ...mockMulterFile,
        size: 10 * 1024 * 1024, // 10MB
      };
      mockFilesService.create.mockResolvedValue({
        ...mockFile,
        size: largeFile.size,
      });

      const result = await controller.uploadFile(largeFile, createFileDto);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.size).toBe(largeFile.size);
      }
    });

    it('should handle different file types', async () => {
      const imageFile: Express.Multer.File = {
        ...mockMulterFile,
        originalname: 'image.png',
        mimetype: 'image/png',
      };
      mockFilesService.create.mockResolvedValue({
        ...mockFile,
        filename: 'image.png',
        mimeType: 'image/png',
      });

      const result = await controller.uploadFile(imageFile, createFileDto);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.mimeType).toBe('image/png');
      }
    });

    it('should handle service errors', async () => {
      mockFilesService.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.uploadFile(mockMulterFile, createFileDto),
      ).rejects.toThrow('Database error');
    });

    it('should handle NotFoundException for parent', async () => {
      const dtoWithParent = {
        ...createFileDto,
        parentId: 'non-existent',
      };
      mockFilesService.create.mockRejectedValue(
        new NotFoundException('Parent file not found'),
      );

      await expect(
        controller.uploadFile(mockMulterFile, dtoWithParent),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all files', async () => {
      const files = [
        { ...mockFile, _count: { children: 0 } },
        { ...mockFile, id: 'file-2', _count: { children: 2 } },
      ];
      mockFilesService.findAll.mockResolvedValue(files);

      const result = await controller.findAll({});

      expect(result).toEqual({
        success: true,
        data: [
          {
            id: mockFile.id,
            filename: mockFile.filename,
            size: mockFile.size,
            mimeType: mockFile.mimeType,
            version: mockFile.version,
            createdAt: mockFile.createdAt,
            agent: mockFile.agent,
            task: mockFile.task,
            parent: mockFile.parent,
            childrenCount: 0,
          },
          {
            id: 'file-2',
            filename: mockFile.filename,
            size: mockFile.size,
            mimeType: mockFile.mimeType,
            version: mockFile.version,
            createdAt: mockFile.createdAt,
            agent: mockFile.agent,
            task: mockFile.task,
            parent: mockFile.parent,
            childrenCount: 2,
          },
        ],
      });
    });

    it('should filter files by taskId', async () => {
      const files = [{ ...mockFile, _count: { children: 0 } }];
      mockFilesService.findAll.mockResolvedValue(files);

      await controller.findAll({ taskId: 'task-1' });

      expect(mockFilesService.findAll).toHaveBeenCalledWith({
        taskId: 'task-1',
      });
    });

    it('should filter files by agentId', async () => {
      const files = [{ ...mockFile, _count: { children: 0 } }];
      mockFilesService.findAll.mockResolvedValue(files);

      await controller.findAll({ agentId: 'agent-1' });

      expect(mockFilesService.findAll).toHaveBeenCalledWith({
        agentId: 'agent-1',
      });
    });

    it('should filter files by parentId', async () => {
      const files = [{ ...mockFile, _count: { children: 0 } }];
      mockFilesService.findAll.mockResolvedValue(files);

      await controller.findAll({ parentId: 'parent-1' });

      expect(mockFilesService.findAll).toHaveBeenCalledWith({
        parentId: 'parent-1',
      });
    });

    it('should return empty array if no files found', async () => {
      mockFilesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll({ taskId: 'non-existent' });

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    it('should handle service errors', async () => {
      mockFilesService.findAll.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findAll({})).rejects.toThrow('Database error');
    });

    it('should handle files without _count property', async () => {
      const files = [mockFile];
      mockFilesService.findAll.mockResolvedValue(files);

      const result = await controller.findAll({});

      expect(result.data[0].childrenCount).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a file by id', async () => {
      mockFilesService.findOne.mockResolvedValue(mockFile);

      const result = await controller.findOne('file-1');

      expect(result).toEqual({
        success: true,
        data: {
          ...mockFile,
          childrenCount: 0,
        },
      });
      expect(mockFilesService.findOne).toHaveBeenCalledWith('file-1');
    });

    it('should throw NotFoundException if file not found', async () => {
      mockFilesService.findOne.mockRejectedValue(
        new NotFoundException('File not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include children count', async () => {
      const fileWithChildren = {
        ...mockFile,
        children: [
          { id: 'child-1', filename: 'child1.pdf' },
          { id: 'child-2', filename: 'child2.pdf' },
        ],
      };
      mockFilesService.findOne.mockResolvedValue(fileWithChildren);

      const result = await controller.findOne('file-1');

      expect(result.data.childrenCount).toBe(2);
    });

    it('should handle file without children', async () => {
      mockFilesService.findOne.mockResolvedValue(mockFile);

      const result = await controller.findOne('file-1');

      expect(result.data.childrenCount).toBe(0);
    });

    it('should handle service errors', async () => {
      mockFilesService.findOne.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findOne('file-1')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('download', () => {
    it('should download a file successfully', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('test content');
        },
      };
      mockFilesService.download.mockResolvedValue({
        file: mockFile,
        stream: mockStream,
      });

      const result = await controller.download('file-1');

      expect(result).toEqual({
        success: true,
        data: {
          filename: mockFile.filename,
          mimeType: mockFile.mimeType,
          size: mockFile.size,
          buffer: Buffer.from('test content').toString('base64'),
        },
      });
    });

    it('should throw NotFoundException if file not found', async () => {
      mockFilesService.download.mockRejectedValue(
        new NotFoundException('File not found'),
      );

      await expect(controller.download('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle file with multiple chunks', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('chunk1');
          yield Buffer.from('chunk2');
          yield Buffer.from('chunk3');
        },
      };
      mockFilesService.download.mockResolvedValue({
        file: mockFile,
        stream: mockStream,
      });

      const result = await controller.download('file-1');

      const expectedBuffer = Buffer.concat([
        Buffer.from('chunk1'),
        Buffer.from('chunk2'),
        Buffer.from('chunk3'),
      ]);
      expect(result.data.buffer).toBe(expectedBuffer.toString('base64'));
    });

    it('should handle large files', async () => {
      const largeContent = Buffer.alloc(5 * 1024 * 1024, 'a'); // 5MB
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield largeContent;
        },
      };
      const largeFile = { ...mockFile, size: largeContent.length };
      mockFilesService.download.mockResolvedValue({
        file: largeFile,
        stream: mockStream,
      });

      const result = await controller.download('file-1');

      expect(result.data.size).toBe(largeContent.length);
    });

    it('should handle service errors', async () => {
      mockFilesService.download.mockRejectedValue(
        new Error('Stream error'),
      );

      await expect(controller.download('file-1')).rejects.toThrow(
        'Stream error',
      );
    });

    it('should throw NotFoundException if file not on disk', async () => {
      mockFilesService.download.mockRejectedValue(
        new NotFoundException('File not found on disk'),
      );

      await expect(controller.download('file-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a file successfully', async () => {
      mockFilesService.remove.mockResolvedValue(mockFile);

      const result = await controller.remove('file-1');

      expect(result).toEqual({
        success: true,
        message: 'File deleted successfully',
      });
      expect(mockFilesService.remove).toHaveBeenCalledWith('file-1');
    });

    it('should throw NotFoundException if file not found', async () => {
      mockFilesService.remove.mockRejectedValue(
        new NotFoundException('File not found'),
      );

      await expect(controller.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle service errors', async () => {
      mockFilesService.remove.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.remove('file-1')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle file deletion with children', async () => {
      mockFilesService.remove.mockResolvedValue(mockFile);

      const result = await controller.remove('file-1');

      expect(result.success).toBe(true);
      expect(mockFilesService.remove).toHaveBeenCalledWith('file-1');
    });
  });

  describe('getFileVersions', () => {
    it('should return all versions of a file', async () => {
      const versions = [
        { ...mockFile, version: 3 },
        { ...mockFile, version: 2 },
        { ...mockFile, version: 1 },
      ];
      mockFilesService.getFileVersions.mockResolvedValue(versions);

      const result = await controller.getFileVersions('test.pdf', 'agent-1');

      expect(result).toEqual({
        success: true,
        data: versions,
      });
      expect(mockFilesService.getFileVersions).toHaveBeenCalledWith(
        'test.pdf',
        'agent-1',
      );
    });

    it('should return empty array if no versions found', async () => {
      mockFilesService.getFileVersions.mockResolvedValue([]);

      const result = await controller.getFileVersions(
        'nonexistent.pdf',
        'agent-1',
      );

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    it('should handle service errors', async () => {
      mockFilesService.getFileVersions.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.getFileVersions('test.pdf', 'agent-1'),
      ).rejects.toThrow('Database error');
    });

    it('should handle files with many versions', async () => {
      const versions = Array.from({ length: 10 }, (_, i) => ({
        ...mockFile,
        version: 10 - i,
      }));
      mockFilesService.getFileVersions.mockResolvedValue(versions);

      const result = await controller.getFileVersions('test.pdf', 'agent-1');

      expect(result.data).toHaveLength(10);
      expect(result.data[0].version).toBe(10);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete file lifecycle', async () => {
      // Upload
      mockFilesService.create.mockResolvedValue(mockFile);
      const uploadResult = await controller.uploadFile(
        mockMulterFile,
        { agentId: 'agent-1' },
      );
      expect(uploadResult.success).toBe(true);

      // Find
      mockFilesService.findOne.mockResolvedValue(mockFile);
      const findResult = await controller.findOne((uploadResult as any).data.id);
      expect(findResult.success).toBe(true);

      // Download
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('test');
        },
      };
      mockFilesService.download.mockResolvedValue({
        file: mockFile,
        stream: mockStream,
      });
      const downloadResult = await controller.download((uploadResult as any).data.id);
      expect(downloadResult.success).toBe(true);

      // Delete
      mockFilesService.remove.mockResolvedValue(mockFile);
      const deleteResult = await controller.remove((uploadResult as any).data.id);
      expect(deleteResult.success).toBe(true);
    });

    it('should handle file versioning workflow', async () => {
      // Upload first version
      mockFilesService.create.mockResolvedValue({ ...mockFile, version: 1 });
      const v1 = await controller.uploadFile(mockMulterFile, {
        agentId: 'agent-1',
      });
      if (v1.success && v1.data) {
        expect(v1.data.version).toBe(1);
      }

      // Upload second version
      mockFilesService.create.mockResolvedValue({ ...mockFile, version: 2 });
      const v2 = await controller.uploadFile(mockMulterFile, {
        agentId: 'agent-1',
      });
      if (v2.success && v2.data) {
        expect(v2.data.version).toBe(2);
      }

      // Get all versions
      mockFilesService.getFileVersions.mockResolvedValue([
        { ...mockFile, version: 2 },
        { ...mockFile, version: 1 },
      ]);
      const versions = await controller.getFileVersions(
        'test.pdf',
        'agent-1',
      );
      expect(versions.data).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle file with special characters in filename', async () => {
      const specialFile: Express.Multer.File = {
        ...mockMulterFile,
        originalname: 'test file (1) [2024].pdf',
      };
      mockFilesService.create.mockResolvedValue({
        ...mockFile,
        filename: 'test file (1) [2024].pdf',
      });

      const result = await controller.uploadFile(specialFile, {
        agentId: 'agent-1',
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.filename).toBe('test file (1) [2024].pdf');
      }
    });

    it('should handle file with unicode filename', async () => {
      const unicodeFile: Express.Multer.File = {
        ...mockMulterFile,
        originalname: '测试文件.pdf',
      };
      mockFilesService.create.mockResolvedValue({
        ...mockFile,
        filename: '测试文件.pdf',
      });

      const result = await controller.uploadFile(unicodeFile, {
        agentId: 'agent-1',
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.filename).toBe('测试文件.pdf');
      }
    });

    it('should handle empty query parameters', async () => {
      mockFilesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll({});

      expect(result.success).toBe(true);
      expect(mockFilesService.findAll).toHaveBeenCalledWith({});
    });

    it('should handle very long file names', async () => {
      const longName = 'a'.repeat(255) + '.pdf';
      const longNameFile: Express.Multer.File = {
        ...mockMulterFile,
        originalname: longName,
      };
      mockFilesService.create.mockResolvedValue({
        ...mockFile,
        filename: longName,
      });

      const result = await controller.uploadFile(longNameFile, {
        agentId: 'agent-1',
      });

      expect(result.success).toBe(true);
    });

    it('should handle concurrent requests', async () => {
      mockFilesService.findAll.mockResolvedValue([mockFile]);

      const requests = Array.from({ length: 10 }, () =>
        controller.findAll({ agentId: 'agent-1' }),
      );

      const results = await Promise.all(requests);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockFilesService.findAll).toHaveBeenCalledTimes(10);
    });
  });
});
