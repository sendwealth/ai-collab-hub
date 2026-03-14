import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkflowEngine, WorkflowState } from './engine/workflow.engine';
import { WorkflowParser } from './parser/workflow.parser';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  StartWorkflowDto,
  ControlWorkflowDto,
  WorkflowDefinitionDto,
} from './dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: WorkflowEngine,
    private readonly parser: WorkflowParser
  ) {}

  // ============================================
  // Template Management
  // ============================================

  /**
   * Create workflow template
   */
  async createTemplate(dto: CreateWorkflowTemplateDto) {
    // Validate workflow definition
    try {
      this.parser.parse(dto.definition);
    } catch (error) {
      throw new BadRequestException(`Invalid workflow definition: ${error.message}`);
    }

    return this.prisma.workflowTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        version: dto.version || '1.0.0',
        definition: JSON.stringify(dto.definition),
        tags: dto.tags ? JSON.stringify(dto.tags) : null,
        author: dto.author,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Get all templates
   */
  async getTemplates(filters?: { category?: string; isActive?: boolean }) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string) {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, dto: UpdateWorkflowTemplateDto) {
    // Validate workflow definition if provided
    if (dto.definition) {
      try {
        this.parser.parse(dto.definition);
      } catch (error) {
        throw new BadRequestException(`Invalid workflow definition: ${error.message}`);
      }
    }

    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return this.prisma.workflowTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        definition: dto.definition ? JSON.stringify(dto.definition) : undefined,
        tags: dto.tags ? JSON.stringify(dto.tags) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    // Check if template has running instances
    const runningInstances = await this.prisma.workflowInstance.count({
      where: {
        templateId: id,
        status: 'running',
      },
    });

    if (runningInstances > 0) {
      throw new BadRequestException(`Cannot delete template with ${runningInstances} running instances`);
    }

    await this.prisma.workflowTemplate.delete({
      where: { id },
    });

    return { success: true };
  }

  // ============================================
  // Instance Management
  // ============================================

  /**
   * Start workflow instance
   */
  async startWorkflow(dto: StartWorkflowDto) {
    const instanceId = await this.engine.startWorkflow(
      dto.templateId,
      dto.taskId,
      dto.context
    );

    return this.getInstance(instanceId);
  }

  /**
   * Get instance by ID
   */
  async getInstance(id: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        template: true,
        nodeExecutions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`Instance ${id} not found`);
    }

    return instance;
  }

  /**
   * Get workflow state
   */
  async getWorkflowState(id: string): Promise<WorkflowState> {
    return this.engine.getWorkflowState(id);
  }

  /**
   * Get all instances
   */
  async getInstances(filters?: { status?: string; templateId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.templateId) {
      where.templateId = filters.templateId;
    }

    return this.prisma.workflowInstance.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(id: string) {
    await this.engine.pauseWorkflow(id);
    return this.getInstance(id);
  }

  /**
   * Resume workflow
   */
  async resumeWorkflow(id: string) {
    await this.engine.resumeWorkflow(id);
    return this.getInstance(id);
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(id: string) {
    await this.engine.cancelWorkflow(id);
    return this.getInstance(id);
  }

  /**
   * Get node execution history
   */
  async getNodeExecutions(instanceId: string) {
    return this.prisma.workflowNodeExecution.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get workflow statistics
   */
  async getStatistics() {
    const [
      totalTemplates,
      activeTemplates,
      totalInstances,
      runningInstances,
      completedInstances,
      failedInstances,
    ] = await Promise.all([
      this.prisma.workflowTemplate.count(),
      this.prisma.workflowTemplate.count({ where: { isActive: true } }),
      this.prisma.workflowInstance.count(),
      this.prisma.workflowInstance.count({ where: { status: 'running' } }),
      this.prisma.workflowInstance.count({ where: { status: 'completed' } }),
      this.prisma.workflowInstance.count({ where: { status: 'failed' } }),
    ]);

    return {
      templates: {
        total: totalTemplates,
        active: activeTemplates,
      },
      instances: {
        total: totalInstances,
        running: runningInstances,
        completed: completedInstances,
        failed: failedInstances,
      },
    };
  }
}
