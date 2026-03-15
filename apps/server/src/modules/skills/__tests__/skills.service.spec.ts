import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from '../skills.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SkillsService', () => {
  let service: SkillsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockSkillTag = {
    id: 'skill-1',
    name: 'TypeScript',
    category: 'frontend',
    level: 3,
    description: 'TypeScript programming language',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAgentSkill = {
    agentId: 'agent-1',
    skillId: 'skill-1',
    level: 4,
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaskSkill = {
    taskId: 'task-1',
    skillId: 'skill-1',
    required: true,
    minLevel: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      skillTag: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      agentSkill: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      },
      taskSkill: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      },
      agent: {
        findUnique: jest.fn(),
      },
      task: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // SkillTag CRUD Tests
  // ============================================

  describe('createSkill', () => {
    it('should create a new skill tag', async () => {
      const createDto = {
        name: 'TypeScript',
        category: 'frontend',
        level: 3,
        description: 'TypeScript programming language',
      };

      prisma.skillTag.findFirst.mockResolvedValue(null);
      prisma.skillTag.create.mockResolvedValue(mockSkillTag);

      const result = await service.createSkill(createDto);

      expect(prisma.skillTag.findFirst).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(prisma.skillTag.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toEqual(mockSkillTag);
    });

    it('should throw BadRequestException if skill name already exists', async () => {
      const createDto = {
        name: 'TypeScript',
        category: 'frontend',
        level: 3,
      };

      prisma.skillTag.findFirst.mockResolvedValue(mockSkillTag);

      await expect(service.createSkill(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate skill level is between 1 and 5', async () => {
      const createDto = {
        name: 'InvalidSkill',
        category: 'test',
        level: 6,
      };

      await expect(service.createSkill(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllSkills', () => {
    it('should return all skills with pagination', async () => {
      const mockSkills = [mockSkillTag];
      prisma.skillTag.findMany.mockResolvedValue(mockSkills);
      prisma.skillTag.count.mockResolvedValue(1);

      const result = await service.findAllSkills({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockSkills);
      expect(result.total).toBe(1);
    });

    it('should filter skills by category', async () => {
      prisma.skillTag.findMany.mockResolvedValue([mockSkillTag]);
      prisma.skillTag.count.mockResolvedValue(1);

      await service.findAllSkills({ category: 'frontend' });

      expect(prisma.skillTag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'frontend' },
        }),
      );
    });

    it('should filter skills by level', async () => {
      prisma.skillTag.findMany.mockResolvedValue([mockSkillTag]);
      prisma.skillTag.count.mockResolvedValue(1);

      await service.findAllSkills({ level: 3 });

      expect(prisma.skillTag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { level: 3 },
        }),
      );
    });
  });

  describe('findSkillById', () => {
    it('should return a skill by id', async () => {
      prisma.skillTag.findUnique.mockResolvedValue(mockSkillTag);

      const result = await service.findSkillById('skill-1');

      expect(result).toEqual(mockSkillTag);
    });

    it('should throw NotFoundException if skill not found', async () => {
      prisma.skillTag.findUnique.mockResolvedValue(null);

      await expect(service.findSkillById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSkill', () => {
    it('should update a skill', async () => {
      const updateDto = { description: 'Updated description' };
      const updatedSkill = { ...mockSkillTag, ...updateDto };

      prisma.skillTag.findUnique.mockResolvedValue(mockSkillTag);
      prisma.skillTag.update.mockResolvedValue(updatedSkill);

      const result = await service.updateSkill('skill-1', updateDto);

      expect(result).toEqual(updatedSkill);
    });
  });

  describe('deleteSkill', () => {
    it('should delete a skill', async () => {
      prisma.skillTag.findUnique.mockResolvedValue(mockSkillTag);
      prisma.skillTag.delete.mockResolvedValue(mockSkillTag);

      await service.deleteSkill('skill-1');

      expect(prisma.skillTag.delete).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
      });
    });
  });

  describe('getCategories', () => {
    it('should return all skill categories', async () => {
      prisma.skillTag.findMany.mockResolvedValue([
        { category: 'frontend' },
        { category: 'backend' },
        { category: 'frontend' },
      ] as any);

      const result = await service.getCategories();

      expect(result).toEqual(['frontend', 'backend']);
    });
  });

  // ============================================
  // Agent Skill Tests
  // ============================================

  describe('addAgentSkill', () => {
    it('should add a skill to an agent', async () => {
      const addDto = { skillId: 'skill-1', level: 4 };

      prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' } as any);
      prisma.skillTag.findUnique.mockResolvedValue(mockSkillTag);
      prisma.agentSkill.findUnique.mockResolvedValue(null);
      prisma.agentSkill.create.mockResolvedValue(mockAgentSkill);

      const result = await service.addAgentSkill('agent-1', addDto);

      expect(result).toEqual(mockAgentSkill);
    });

    it('should throw NotFoundException if agent not found', async () => {
      prisma.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.addAgentSkill('non-existent', { skillId: 'skill-1', level: 4 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if skill not found', async () => {
      prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' } as any);
      prisma.skillTag.findUnique.mockResolvedValue(null);

      await expect(
        service.addAgentSkill('agent-1', { skillId: 'non-existent', level: 4 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if agent already has the skill', async () => {
      const addDto = { skillId: 'skill-1', level: 4 };

      prisma.agent.findUnique.mockResolvedValue({ id: 'agent-1' } as any);
      prisma.skillTag.findUnique.mockResolvedValue(mockSkillTag);
      prisma.agentSkill.findUnique.mockResolvedValue(mockAgentSkill);

      await expect(service.addAgentSkill('agent-1', addDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeAgentSkill', () => {
    it('should remove a skill from an agent', async () => {
      prisma.agentSkill.findUnique.mockResolvedValue(mockAgentSkill);
      prisma.agentSkill.delete.mockResolvedValue(mockAgentSkill);

      await service.removeAgentSkill('agent-1', 'skill-1');

      expect(prisma.agentSkill.delete).toHaveBeenCalledWith({
        where: {
          agentId_skillId: {
            agentId: 'agent-1',
            skillId: 'skill-1',
          },
        },
      });
    });

    it('should throw NotFoundException if agent skill not found', async () => {
      prisma.agentSkill.findUnique.mockResolvedValue(null);

      await expect(
        service.removeAgentSkill('agent-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAgentSkills', () => {
    it('should return all skills for an agent', async () => {
      prisma.agentSkill.findMany.mockResolvedValue([mockAgentSkill]);

      const result = await service.getAgentSkills('agent-1');

      expect(result).toEqual([mockAgentSkill]);
    });
  });

  describe('verifyAgentSkill', () => {
    it('should verify an agent skill', async () => {
      const verifiedSkill = { ...mockAgentSkill, verified: true };

      prisma.agentSkill.findUnique.mockResolvedValue(mockAgentSkill);
      prisma.agentSkill.update.mockResolvedValue(verifiedSkill);

      const result = await service.verifyAgentSkill('agent-1', 'skill-1');

      expect(result.verified).toBe(true);
    });
  });

  // ============================================
  // Task Skill Tests
  // ============================================

  describe('addTaskSkill', () => {
    it('should add a skill requirement to a task', async () => {
      const addDto = { skillId: 'skill-1', required: true, minLevel: 3 };

      prisma.task.findUnique.mockResolvedValue({ id: 'task-1' } as any);
      prisma.skillTag.findUnique.mockResolvedValue(mockSkillTag);
      prisma.taskSkill.findUnique.mockResolvedValue(null);
      prisma.taskSkill.create.mockResolvedValue(mockTaskSkill);

      const result = await service.addTaskSkill('task-1', addDto);

      expect(result).toEqual(mockTaskSkill);
    });

    it('should throw NotFoundException if task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.addTaskSkill('non-existent', {
          skillId: 'skill-1',
          required: true,
          minLevel: 3,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeTaskSkill', () => {
    it('should remove a skill requirement from a task', async () => {
      prisma.taskSkill.findUnique.mockResolvedValue(mockTaskSkill);
      prisma.taskSkill.delete.mockResolvedValue(mockTaskSkill);

      await service.removeTaskSkill('task-1', 'skill-1');

      expect(prisma.taskSkill.delete).toHaveBeenCalledWith({
        where: {
          taskId_skillId: {
            taskId: 'task-1',
            skillId: 'skill-1',
          },
        },
      });
    });
  });

  describe('getTaskSkills', () => {
    it('should return all skill requirements for a task', async () => {
      prisma.taskSkill.findMany.mockResolvedValue([mockTaskSkill]);

      const result = await service.getTaskSkills('task-1');

      expect(result).toEqual([mockTaskSkill]);
    });
  });

  // ============================================
  // Skill Recommendation Tests
  // ============================================

  describe('recommendSkillsForTask', () => {
    it('should recommend skills based on task description', async () => {
      const taskDescription = 'Build a React frontend with TypeScript';

      prisma.skillTag.findMany.mockResolvedValue([
        mockSkillTag,
        { ...mockSkillTag, id: 'skill-2', name: 'React', category: 'frontend' },
      ]);

      const result = await service.recommendSkillsForTask(taskDescription);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getSkillStatistics', () => {
    it('should return skill usage statistics', async () => {
      prisma.skillTag.findMany.mockResolvedValue([mockSkillTag]);
      prisma.agentSkill.count.mockResolvedValue(10);
      prisma.taskSkill.count.mockResolvedValue(5);

      const result = await service.getSkillStatistics();

      expect(result).toHaveProperty('totalSkills');
      expect(result).toHaveProperty('categories');
    });
  });
});
