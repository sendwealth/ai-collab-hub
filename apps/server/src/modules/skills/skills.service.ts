import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateSkillDto,
  UpdateSkillDto,
  SkillQueryDto,
  AddAgentSkillDto,
  UpdateAgentSkillDto,
  AddTaskSkillDto,
  UpdateTaskSkillDto,
  PaginatedSkillsResponseDto,
  SkillStatisticsDto,
  SkillRecommendationDto,
} from './dto/skills.dto';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // SkillTag CRUD
  // ============================================

  async createSkill(dto: CreateSkillDto) {
    // Validate level
    if (dto.level < 1 || dto.level > 5) {
      throw new BadRequestException('Skill level must be between 1 and 5');
    }

    // Check if skill name already exists
    const existing = await this.prisma.skillTag.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(
        `Skill with name "${dto.name}" already exists`,
      );
    }

    return this.prisma.skillTag.create({
      data: dto,
    });
  }

  async findAllSkills(query: SkillQueryDto): Promise<PaginatedSkillsResponseDto> {
    const { page = 1, limit = 10, category, level, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.skillTag.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.skillTag.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSkillById(id: string) {
    const skill = await this.prisma.skillTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { agents: true, tasks: true },
        },
      },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with id "${id}" not found`);
    }

    return skill;
  }

  async updateSkill(id: string, dto: UpdateSkillDto) {
    await this.findSkillById(id);

    if (dto.level !== undefined && (dto.level < 1 || dto.level > 5)) {
      throw new BadRequestException('Skill level must be between 1 and 5');
    }

    return this.prisma.skillTag.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSkill(id: string) {
    await this.findSkillById(id);

    return this.prisma.skillTag.delete({
      where: { id },
    });
  }

  async getCategories(): Promise<string[]> {
    const skills = await this.prisma.skillTag.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return skills.map((s) => s.category);
  }

  // ============================================
  // Agent Skills
  // ============================================

  async addAgentSkill(agentId: string, dto: AddAgentSkillDto) {
    // Check agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with id "${agentId}" not found`);
    }

    // Check skill exists
    const skill = await this.prisma.skillTag.findUnique({
      where: { id: dto.skillId },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with id "${dto.skillId}" not found`);
    }

    // Check if already has the skill
    const existing = await this.prisma.agentSkill.findUnique({
      where: {
        agentId_skillId: {
          agentId,
          skillId: dto.skillId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Agent already has skill "${skill.name}"`,
      );
    }

    return this.prisma.agentSkill.create({
      data: {
        agentId,
        skillId: dto.skillId,
        level: dto.level,
      },
    });
  }

  async removeAgentSkill(agentId: string, skillId: string) {
    const agentSkill = await this.prisma.agentSkill.findUnique({
      where: {
        agentId_skillId: {
          agentId,
          skillId,
        },
      },
    });

    if (!agentSkill) {
      throw new NotFoundException(
        `Agent skill not found for agent "${agentId}" and skill "${skillId}"`,
      );
    }

    return this.prisma.agentSkill.delete({
      where: {
        agentId_skillId: {
          agentId,
          skillId,
        },
      },
    });
  }

  async getAgentSkills(agentId: string) {
    return this.prisma.agentSkill.findMany({
      where: { agentId },
      include: {
        skill: true,
      },
    });
  }

  async updateAgentSkill(
    agentId: string,
    skillId: string,
    dto: UpdateAgentSkillDto,
  ) {
    const agentSkill = await this.prisma.agentSkill.findUnique({
      where: {
        agentId_skillId: {
          agentId,
          skillId,
        },
      },
    });

    if (!agentSkill) {
      throw new NotFoundException(
        `Agent skill not found for agent "${agentId}" and skill "${skillId}"`,
      );
    }

    return this.prisma.agentSkill.update({
      where: {
        agentId_skillId: {
          agentId,
          skillId,
        },
      },
      data: dto,
    });
  }

  async verifyAgentSkill(agentId: string, skillId: string) {
    const agentSkill = await this.prisma.agentSkill.findUnique({
      where: {
        agentId_skillId: {
          agentId,
          skillId,
        },
      },
    });

    if (!agentSkill) {
      throw new NotFoundException(
        `Agent skill not found for agent "${agentId}" and skill "${skillId}"`,
      );
    }

    return this.prisma.agentSkill.update({
      where: {
        agentId_skillId: {
          agentId,
          skillId,
        },
      },
      data: { verified: true },
    });
  }

  // ============================================
  // Task Skills
  // ============================================

  async addTaskSkill(taskId: string, dto: AddTaskSkillDto) {
    // Check task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with id "${taskId}" not found`);
    }

    // Check skill exists
    const skill = await this.prisma.skillTag.findUnique({
      where: { id: dto.skillId },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with id "${dto.skillId}" not found`);
    }

    // Check if already has the skill requirement
    const existing = await this.prisma.taskSkill.findUnique({
      where: {
        taskId_skillId: {
          taskId,
          skillId: dto.skillId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Task already has skill requirement "${skill.name}"`,
      );
    }

    return this.prisma.taskSkill.create({
      data: {
        taskId,
        skillId: dto.skillId,
        required: dto.required ?? true,
        minLevel: dto.minLevel ?? 1,
      },
    });
  }

  async removeTaskSkill(taskId: string, skillId: string) {
    const taskSkill = await this.prisma.taskSkill.findUnique({
      where: {
        taskId_skillId: {
          taskId,
          skillId,
        },
      },
    });

    if (!taskSkill) {
      throw new NotFoundException(
        `Task skill not found for task "${taskId}" and skill "${skillId}"`,
      );
    }

    return this.prisma.taskSkill.delete({
      where: {
        taskId_skillId: {
          taskId,
          skillId,
        },
      },
    });
  }

  async getTaskSkills(taskId: string) {
    return this.prisma.taskSkill.findMany({
      where: { taskId },
      include: {
        skill: true,
      },
    });
  }

  async updateTaskSkill(
    taskId: string,
    skillId: string,
    dto: UpdateTaskSkillDto,
  ) {
    const taskSkill = await this.prisma.taskSkill.findUnique({
      where: {
        taskId_skillId: {
          taskId,
          skillId,
        },
      },
    });

    if (!taskSkill) {
      throw new NotFoundException(
        `Task skill not found for task "${taskId}" and skill "${skillId}"`,
      );
    }

    return this.prisma.taskSkill.update({
      where: {
        taskId_skillId: {
          taskId,
          skillId,
        },
      },
      data: dto,
    });
  }

  // ============================================
  // Skill Recommendations
  // ============================================

  async recommendSkillsForTask(
    description: string,
  ): Promise<SkillRecommendationDto[]> {
    const allSkills = await this.prisma.skillTag.findMany();

    // Simple keyword matching for skill recommendations
    const recommendations: SkillRecommendationDto[] = [];

    const keywords: Record<string, string[]> = {
      frontend: ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'frontend', 'ui', 'web'],
      backend: ['node', 'python', 'java', 'api', 'server', 'backend', 'database', 'sql', 'nosql'],
      ai: ['ai', 'machine learning', 'ml', 'deep learning', 'neural', 'nlp', 'cv', 'gpt', 'llm'],
      data: ['data', 'analytics', 'etl', 'pipeline', 'big data', 'spark', 'hadoop'],
      devops: ['devops', 'docker', 'kubernetes', 'ci', 'cd', 'jenkins', 'terraform', 'cloud'],
      design: ['design', 'ui', 'ux', 'figma', 'sketch', 'prototype', 'wireframe'],
    };

    const lowerDescription = description.toLowerCase();

    for (const skill of allSkills) {
      const categoryKeywords = keywords[skill.category] || [];
      const skillKeywords = [skill.name.toLowerCase()];

      let matchCount = 0;
      let matchedKeywords: string[] = [];

      for (const keyword of [...categoryKeywords, ...skillKeywords]) {
        if (lowerDescription.includes(keyword)) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(matchCount / 3, 1);
        recommendations.push({
          skill,
          confidence,
          reason: `Matched keywords: ${matchedKeywords.join(', ')}`,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  // ============================================
  // Statistics
  // ============================================

  async getSkillStatistics(): Promise<SkillStatisticsDto> {
    const [totalSkills, skills, agentSkillCounts, taskSkillCounts] =
      await Promise.all([
        this.prisma.skillTag.count(),
        this.prisma.skillTag.findMany(),
        this.prisma.agentSkill.groupBy({
          by: ['skillId'],
          _count: { agentId: true },
        }),
        this.prisma.taskSkill.groupBy({
          by: ['skillId'],
          _count: { taskId: true },
        }),
      ]);

    // Category distribution
    const categoryMap = new Map<string, number>();
    for (const skill of skills) {
      categoryMap.set(
        skill.category,
        (categoryMap.get(skill.category) || 0) + 1,
      );
    }
    const categories = Array.from(categoryMap.entries()).map(
      ([category, count]) => ({ category, count }),
    );

    // Level distribution
    const levelMap = new Map<number, number>();
    for (const skill of skills) {
      levelMap.set(skill.level, (levelMap.get(skill.level) || 0) + 1);
    }
    const levelDistribution = Array.from(levelMap.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => a.level - b.level);

    // Top agent skills
    const skillNameMap = new Map(skills.map((s) => [s.id, s.name]));
    const topAgentSkills = agentSkillCounts
      .map((item) => ({
        skillId: item.skillId,
        skillName: skillNameMap.get(item.skillId) || 'Unknown',
        agentCount: item._count.agentId,
      }))
      .sort((a, b) => b.agentCount - a.agentCount)
      .slice(0, 10);

    // Top task skills
    const topTaskSkills = taskSkillCounts
      .map((item) => ({
        skillId: item.skillId,
        skillName: skillNameMap.get(item.skillId) || 'Unknown',
        taskCount: item._count.taskId,
      }))
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 10);

    return {
      totalSkills,
      categories,
      levelDistribution,
      topAgentSkills,
      topTaskSkills,
    };
  }
}
