import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CacheService } from '../cache';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'array';
  required?: boolean;
  label?: string;
  default?: any;
  options?: any[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface TemplateContent {
  title: string;
  description?: string;
  budget?: {
    min: number;
    max: number;
  };
  deadline?: number; // 天数
  requiredSkills?: string[];
  checklist?: string[];
  attachments?: string[];
}

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    private cache: CacheService,
  ) {}

  /**
   * 创建模板
   */
  async create(agentId: string, data: {
    name: string;
    description?: string;
    category: string;
    template: TemplateContent;
    variables: TemplateVariable[];
    public?: boolean;
  }) {
    // 验证模板结构
    this.validateTemplateStructure(data);

    const template = await this.prisma.taskTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        template: JSON.stringify(data.template),
        variables: JSON.stringify(data.variables),
        public: data.public || false,
        createdBy: agentId,
      },
    });

    await this.cache.invalidate('templates:*');

    return {
      ...template,
      template: JSON.parse(template.template),
      variables: JSON.parse(template.variables),
    };
  }

  /**
   * 获取模板列表
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    category?: string;
    publicOnly?: boolean;
    createdBy?: string;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (options.category) {
      where.category = options.category;
    }

    if (options.publicOnly) {
      where.public = true;
    }

    if (options.createdBy) {
      where.createdBy = options.createdBy;
    }

    const [templates, total] = await Promise.all([
      this.prisma.taskTemplate.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
        ],
      }),
      this.prisma.taskTemplate.count({ where }),
    ]);

    return {
      templates: templates.map(t => ({
        ...t,
        template: JSON.parse(t.template),
        variables: JSON.parse(t.variables),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * 获取单个模板
   */
  async findOne(id: string) {
    const template = await this.prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return {
      ...template,
      template: JSON.parse(template.template),
      variables: JSON.parse(template.variables),
    };
  }

  /**
   * 更新模板
   */
  async update(id: string, agentId: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    template: TemplateContent;
    variables: TemplateVariable[];
    public: boolean;
  }>) {
    const existing = await this.prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    if (existing.createdBy !== agentId) {
      throw new UnauthorizedException('Unauthorized to update this template');
    }

    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.template) updateData.template = JSON.stringify(data.template);
    if (data.variables) updateData.variables = JSON.stringify(data.variables);
    if (data.public !== undefined) updateData.public = data.public;

    const template = await this.prisma.taskTemplate.update({
      where: { id },
      data: updateData,
    });

    await this.cache.invalidate('templates:*');

    return {
      ...template,
      template: JSON.parse(template.template),
      variables: JSON.parse(template.variables),
    };
  }

  /**
   * 删除模板
   */
  async delete(id: string, agentId: string) {
    const template = await this.prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdBy !== agentId) {
      throw new UnauthorizedException('Unauthorized to delete this template');
    }

    await this.prisma.taskTemplate.delete({
      where: { id },
    });

    await this.cache.invalidate('templates:*');
  }

  /**
   * 从模板创建任务
   */
  async createFromTemplate(
    templateId: string,
    agentId: string,
    variables: Record<string, any>,
  ) {
    // 1. 获取模板
    const template = await this.findOne(templateId);

    // 2. 验证变量
    this.validateVariables(template.variables, variables);

    // 3. 渲染模板
    const taskData = this.renderTemplate(template.template, variables);

    // 4. 创建任务
    const task = await this.tasksService.createTask(agentId, {
      title: taskData.title,
      description: taskData.description,
      category: template.category,
      requirements: {
        budget: taskData.budget,
        skills: taskData.requiredSkills,
        checklist: taskData.checklist,
      },
      deadline: taskData.deadline
        ? new Date(Date.now() + taskData.deadline * 24 * 60 * 60 * 1000)
        : undefined,
    });

    // 5. 记录使用
    await this.prisma.taskTemplateUsage.create({
      data: {
        templateId,
        taskId: task.taskId,
        variables: JSON.stringify(variables),
      },
    });

    // 6. 更新使用次数
    await this.prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    await this.cache.invalidate('templates:*');

    return task;
  }

  /**
   * 推荐模板
   */
  async recommendTemplates(category: string, limit: number = 10) {
    const cacheKey = `templates:recommend:${category}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const templates = await this.prisma.taskTemplate.findMany({
          where: {
            public: true,
            category,
          },
          orderBy: [
            { usageCount: 'desc' },
            { rating: 'desc' },
          ],
          take: limit,
        });

        return templates.map(t => ({
          ...t,
          template: JSON.parse(t.template),
          variables: JSON.parse(t.variables),
        }));
      },
      300, // 5分钟缓存
    );
  }

  /**
   * 评分模板
   */
  async rateTemplate(templateId: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const template = await this.prisma.taskTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // 计算新的平均评分
    const newRating =
      (template.rating * template.usageCount + rating) /
      (template.usageCount + 1);

    const updated = await this.prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        rating: newRating,
      },
    });

    await this.cache.invalidate('templates:*');

    return {
      ...updated,
      template: JSON.parse(updated.template),
      variables: JSON.parse(updated.variables),
    };
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(templateId: string) {
    const usages = await this.prisma.taskTemplateUsage.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      totalUsages: usages.length,
      recentUsages: usages.map(u => ({
        ...u,
        variables: JSON.parse(u.variables),
      })),
    };
  }

  /**
   * 渲染模板
   */
  renderTemplate(
    template: TemplateContent,
    variables: Record<string, any>,
  ): any {
    const render = (str: string) => {
      return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return variables[key] !== undefined ? String(variables[key]) : '';
      });
    };

    return {
      title: render(template.title),
      description: template.description
        ? render(template.description)
        : undefined,
      budget: template.budget,
      deadline: template.deadline,
      requiredSkills: template.requiredSkills,
      checklist: template.checklist,
      attachments: template.attachments,
    };
  }

  /**
   * 验证模板结构
   */
  private validateTemplateStructure(data: any) {
    if (!data.name || data.name.trim() === '') {
      throw new BadRequestException('Template name is required');
    }

    if (!data.category) {
      throw new BadRequestException('Category is required');
    }

    if (!data.template || !data.template.title) {
      throw new BadRequestException('Template title is required');
    }

    if (!Array.isArray(data.variables)) {
      throw new BadRequestException('Variables must be an array');
    }

    // 验证变量定义
    for (const variable of data.variables) {
      if (!variable.name) {
        throw new BadRequestException('Variable name is required');
      }

      if (!['string', 'number', 'date', 'array'].includes(variable.type)) {
        throw new BadRequestException(
          `Invalid type for variable ${variable.name}`,
        );
      }
    }
  }

  /**
   * 验证变量
   */
  validateVariables(
    definitions: TemplateVariable[],
    values: Record<string, any>,
  ) {
    for (const def of definitions) {
      const value = values[def.name];

      // 检查必填项
      if (def.required && value === undefined) {
        throw new BadRequestException(
          `Missing required variable: ${def.name}`,
        );
      }

      // 如果没有提供值且不是必填，跳过验证
      if (value === undefined) {
        continue;
      }

      // 类型验证
      switch (def.type) {
        case 'string':
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Variable ${def.name} must be string`,
            );
          }

          // 模式验证
          if (def.validation?.pattern) {
            const regex = new RegExp(def.validation.pattern);
            if (!regex.test(value)) {
              throw new BadRequestException(
                `Variable ${def.name} does not match required pattern`,
              );
            }
          }
          break;

        case 'number':
          if (typeof value !== 'number') {
            throw new BadRequestException(
              `Variable ${def.name} must be number`,
            );
          }

          // 范围验证
          if (def.validation?.min !== undefined && value < def.validation.min) {
            throw new BadRequestException(
              `Variable ${def.name} must be at least ${def.validation.min}`,
            );
          }
          if (def.validation?.max !== undefined && value > def.validation.max) {
            throw new BadRequestException(
              `Variable ${def.name} must be at most ${def.validation.max}`,
            );
          }
          break;

        case 'date':
          if (isNaN(Date.parse(value))) {
            throw new BadRequestException(
              `Variable ${def.name} must be a valid date`,
            );
          }
          break;

        case 'array':
          if (!Array.isArray(value)) {
            throw new BadRequestException(
              `Variable ${def.name} must be array`,
            );
          }

          // 选项验证
          if (def.options) {
            for (const item of value) {
              if (!def.options.includes(item)) {
                throw new BadRequestException(
                  `Invalid option ${item} for variable ${def.name}`,
                );
              }
            }
          }
          break;
      }
    }
  }
}
