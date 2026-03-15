import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CacheService } from '../cache';

describe('TemplatesService', () => {
  let service: TemplatesService;

  const mockPrismaService = {
    taskTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    taskTemplateUsage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    task: {
      create: jest.fn(),
    },
  };

  const mockTasksService = {
    createTask: jest.fn(),
  };

  const mockCacheService = {
    invalidate: jest.fn(),
    getOrSet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task template', async () => {
      const templateData = {
        name: 'Website Development',
        description: 'Template for web development projects',
        category: 'development',
        template: {
          title: '{{projectName}} Website',
          description: 'Build a {{projectType}} website',
          budget: { min: 5000, max: 50000 },
          deadline: 30,
          requiredSkills: ['Frontend', 'Backend'],
          checklist: ['Requirements', 'Design', 'Development', 'Testing'],
        },
        variables: [
          {
            name: 'projectName',
            type: 'string',
            required: true,
            label: 'Project Name',
          },
          {
            name: 'projectType',
            type: 'string',
            required: true,
            label: 'Project Type',
            options: ['Corporate', 'E-commerce', 'Social'],
          },
        ],
        public: true,
      };

      mockPrismaService.taskTemplate.create.mockResolvedValue({
        id: 'template-1',
        ...templateData,
        template: JSON.stringify(templateData.template),
        variables: JSON.stringify(templateData.variables),
        createdBy: 'agent-1',
        usageCount: 0,
        rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('agent-1', templateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(mockPrismaService.taskTemplate.create).toHaveBeenCalled();
    });

    it('should validate template structure', async () => {
      const invalidTemplate = {
        name: '',
        category: 'development',
        template: {},
        variables: [],
      };

      await expect(service.create('agent-1', invalidTemplate)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return list of templates with pagination', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Template 1',
          category: 'development',
          usageCount: 10,
          rating: 4.5,
        },
        {
          id: '2',
          name: 'Template 2',
          category: 'design',
          usageCount: 5,
          rating: 4.0,
        },
      ];

      mockPrismaService.taskTemplate.findMany.mockResolvedValue(mockTemplates);
      mockPrismaService.taskTemplate.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.templates).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter templates by category', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Dev Template',
          category: 'development',
        },
      ];

      mockPrismaService.taskTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.findAll({ category: 'development' });

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].category).toBe('development');
    });

    it('should only return public templates for non-owners', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Public Template',
          category: 'development',
          public: true,
        },
      ];

      mockPrismaService.taskTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.findAll({ publicOnly: true });

      expect(mockPrismaService.taskTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            public: true,
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return template by id', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Website Template',
        category: 'development',
        template: JSON.stringify({
          title: '{{projectName}}',
          budget: { min: 5000, max: 50000 },
        }),
        variables: JSON.stringify([
          { name: 'projectName', type: 'string' },
        ]),
      };

      mockPrismaService.taskTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.findOne('template-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('template-1');
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.taskTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow('Template not found');
    });
  });

  describe('update', () => {
    it('should update template', async () => {
      const updateData = {
        name: 'Updated Template',
        description: 'Updated description',
      };

      mockPrismaService.taskTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        createdBy: 'agent-1',
      });

      mockPrismaService.taskTemplate.update.mockResolvedValue({
        id: 'template-1',
        ...updateData,
      });

      const result = await service.update('template-1', 'agent-1', updateData);

      expect(result.name).toBe(updateData.name);
      expect(mockPrismaService.taskTemplate.update).toHaveBeenCalled();
    });

    it('should not allow non-owners to update', async () => {
      mockPrismaService.taskTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        createdBy: 'agent-1',
      });

      await expect(
        service.update('template-1', 'agent-2', { name: 'Hacked' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('delete', () => {
    it('should delete template', async () => {
      mockPrismaService.taskTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        createdBy: 'agent-1',
      });

      mockPrismaService.taskTemplate.delete.mockResolvedValue({
        id: 'template-1',
      });

      await service.delete('template-1', 'agent-1');

      expect(mockPrismaService.taskTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });
  });

  describe('createFromTemplate', () => {
    it('should create task from template', async () => {
      const template = {
        id: 'template-1',
        name: 'Website Template',
        template: JSON.stringify({
          title: '{{projectName}} Website',
          description: 'Build {{projectType}}',
          budget: { min: 5000, max: 50000 },
          deadline: 30,
          requiredSkills: ['Frontend', 'Backend'],
          checklist: ['Design', 'Develop', 'Test'],
        }),
        variables: JSON.stringify([
          {
            name: 'projectName',
            type: 'string',
            required: true,
          },
          {
            name: 'projectType',
            type: 'string',
            required: true,
          },
        ]),
      };

      const variables = {
        projectName: 'MyProject',
        projectType: 'E-commerce',
      };

      mockPrismaService.taskTemplate.findUnique.mockResolvedValue(template);
      
      mockTasksService.createTask.mockResolvedValue({
        taskId: 'task-1',
        task: {
          id: 'task-1',
          title: 'MyProject Website',
          description: 'Build E-commerce',
        },
      });

      mockPrismaService.taskTemplateUsage.create.mockResolvedValue({
        id: 'usage-1',
        templateId: 'template-1',
        taskId: 'task-1',
        variables: JSON.stringify(variables),
      });

      mockPrismaService.taskTemplate.update.mockResolvedValue({
        id: 'template-1',
        usageCount: 1,
      });

      const result = await service.createFromTemplate(
        'template-1',
        'agent-1',
        variables
      );

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-1');
      expect(mockTasksService.createTask).toHaveBeenCalled();
    });

    it('should validate required variables', async () => {
      const template = {
        id: 'template-1',
        template: JSON.stringify({
          title: '{{projectName}}',
        }),
        variables: JSON.stringify([
          {
            name: 'projectName',
            type: 'string',
            required: true,
          },
        ]),
      };

      mockPrismaService.taskTemplate.findUnique.mockResolvedValue(template);

      await expect(
        service.createFromTemplate('template-1', 'agent-1', {})
      ).rejects.toThrow('Missing required variable: projectName');
    });

    it('should render template variables correctly', () => {
      const templateContent = {
        title: '{{projectName}} - {{projectType}}',
        description: 'Build {{features}}',
      };

      const variables = {
        projectName: 'MyApp',
        projectType: 'Mobile',
        features: 'Auth, Payment',
      };

      const rendered = service.renderTemplate(templateContent, variables);

      expect(rendered.title).toBe('MyApp - Mobile');
      expect(rendered.description).toBe('Build Auth, Payment');
    });

    it('should handle missing optional variables', () => {
      const templateContent = {
        title: '{{projectName}} {{optional}}',
      };

      const variables = {
        projectName: 'MyApp',
      };

      const rendered = service.renderTemplate(templateContent, variables);

      expect(rendered.title).toBe('MyApp ');
    });
  });

  describe('recommendTemplates', () => {
    it('should recommend popular templates by category', async () => {
      const mockTemplates = [
        { id: '1', name: 'Popular 1', usageCount: 100, rating: 4.8 },
        { id: '2', name: 'Popular 2', usageCount: 80, rating: 4.5 },
        { id: '3', name: 'Popular 3', usageCount: 60, rating: 4.3 },
      ];

      mockPrismaService.taskTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.recommendTemplates('development', 5);

      expect(result).toHaveLength(3);
      expect(mockPrismaService.taskTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            public: true,
            category: 'development',
          },
          orderBy: [
            { usageCount: 'desc' },
            { rating: 'desc' },
          ],
        })
      );
    });

    it('should limit number of recommendations', async () => {
      const mockTemplates = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Template ${i}`,
        usageCount: 100 - i,
        rating: 5 - i * 0.1,
      }));

      mockPrismaService.taskTemplate.findMany.mockResolvedValue(
        mockTemplates.slice(0, 5)
      );

      const result = await service.recommendTemplates('development', 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('rateTemplate', () => {
    it('should update template rating', async () => {
      mockPrismaService.taskTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        rating: 4.0,
        usageCount: 10,
      });

      mockPrismaService.taskTemplate.update.mockResolvedValue({
        id: 'template-1',
        rating: 4.5,
      });

      const result = await service.rateTemplate('template-1', 5);

      expect(result.rating).toBeGreaterThan(4.0);
      expect(mockPrismaService.taskTemplate.update).toHaveBeenCalled();
    });

    it('should validate rating value', async () => {
      await expect(
        service.rateTemplate('template-1', 6)
      ).rejects.toThrow('Rating must be between 1 and 5');

      await expect(
        service.rateTemplate('template-1', 0)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('getUsageStats', () => {
    it('should return template usage statistics', async () => {
      const mockUsages = [
        {
          id: '1',
          templateId: 'template-1',
          taskId: 'task-1',
          variables: JSON.stringify({ name: 'Project 1' }),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          templateId: 'template-1',
          taskId: 'task-2',
          variables: JSON.stringify({ name: 'Project 2' }),
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockPrismaService.taskTemplateUsage.findMany.mockResolvedValue(mockUsages);

      const stats = await service.getUsageStats('template-1');

      expect(stats).toBeDefined();
      expect(stats.totalUsages).toBe(2);
      expect(stats.recentUsages).toHaveLength(2);
    });
  });

  describe('validateVariables', () => {
    it('should validate string type variables', () => {
      const variables = [
        { name: 'title', type: 'string' as const, required: true },
      ];

      expect(() =>
        service.validateVariables(variables, { title: 'Valid' })
      ).not.toThrow();

      expect(() =>
        service.validateVariables(variables, { title: 123 })
      ).toThrow('Variable title must be string');
    });

    it('should validate number type variables', () => {
      const variables = [
        { name: 'count', type: 'number' as const, validation: { min: 1, max: 100 } },
      ];

      expect(() =>
        service.validateVariables(variables, { count: 50 })
      ).not.toThrow();

      expect(() =>
        service.validateVariables(variables, { count: 0 })
      ).toThrow('Variable count must be at least 1');
    });

    it('should validate array type variables', () => {
      const variables = [
        {
          name: 'features',
          type: 'array' as const,
          options: ['Auth', 'Payment', 'Admin'],
        },
      ];

      expect(() =>
        service.validateVariables(variables, { features: ['Auth', 'Payment'] })
      ).not.toThrow();

      expect(() =>
        service.validateVariables(variables, { features: ['Invalid'] })
      ).toThrow('Invalid option Invalid for variable features');
    });

    it('should validate pattern for string variables', () => {
      const variables = [
        {
          name: 'email',
          type: 'string' as const,
          validation: { pattern: '^[a-z]+@[a-z]+\\.[a-z]+$' },
        },
      ];

      expect(() =>
        service.validateVariables(variables, { email: 'test@example.com' })
      ).not.toThrow();

      expect(() =>
        service.validateVariables(variables, { email: 'invalid' })
      ).toThrow('Variable email does not match required pattern');
    });
  });
});
