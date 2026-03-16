import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkflowEngine, WorkflowState } from './engine/workflow.engine';
import { WorkflowParser } from './parser/workflow.parser';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  StartWorkflowDto,
  RunWorkflowDto,
  WorkflowExecutionResult,
  NodeExecutionResult,
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
    } catch (error: unknown) {
      throw new BadRequestException(`Invalid workflow definition: ${error instanceof Error ? error.message : String(error)}`);
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
      } catch (error: unknown) {
        throw new BadRequestException(`Invalid workflow definition: ${error instanceof Error ? error.message : String(error)}`);
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

  // ============================================
  // Direct Workflow Execution (without template)
  // ============================================

  /**
   * Run workflow definition directly without creating a template
   */
  async runWorkflowDefinition(dto: RunWorkflowDto): Promise<WorkflowExecutionResult> {
    const startTime = new Date();
    const steps: NodeExecutionResult[] = [];
    const context: Record<string, any> = dto.context || {};

    try {
      // Parse and validate workflow definition
      const parsedWorkflow = this.parser.parse(dto.definition);

      // Execute workflow
      const result = await this.executeWorkflowDirectly(
        parsedWorkflow.startNode,
        parsedWorkflow,
        context,
        steps
      );

      const endTime = new Date();

      return {
        status: result.success ? 'completed' : 'failed',
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        steps,
        context: result.context,
        error: result.error,
      };
    } catch (error: unknown) {
      const endTime = new Date();
      const errorMsg = error instanceof Error ? error.message : String(error);

      return {
        status: 'failed',
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        steps,
        context,
        error: errorMsg,
      };
    }
  }

  /**
   * Execute workflow directly (in-memory execution)
   */
  private async executeWorkflowDirectly(
    startNodeId: string,
    workflow: ReturnType<typeof this.parser.parse>,
    context: Record<string, any>,
    steps: NodeExecutionResult[]
  ): Promise<{ success: boolean; context: Record<string, any>; error?: string }> {
    let currentNodeId: string | null = startNodeId;
    const visited = new Set<string>();
    const maxIterations = 1000;
    let iterations = 0;

    while (currentNodeId && iterations < maxIterations) {
      iterations++;

      const node = workflow.nodes.get(currentNodeId);
      if (!node) {
        return { success: false, context, error: `Node ${currentNodeId} not found` };
      }

      // Check for infinite loops
      if (node.type !== 'loop' && visited.has(currentNodeId)) {
        return { success: false, context, error: `Detected infinite loop at node ${currentNodeId}` };
      }
      visited.add(currentNodeId);

      // Execute node
      const stepResult: NodeExecutionResult = {
        nodeId: node.id,
        nodeType: node.type,
        status: 'running',
        startedAt: new Date(),
      };

      try {
        const result = await this.executeNodeDirectly(node, context, workflow);
        stepResult.status = 'completed';
        stepResult.output = result.output;
        stepResult.completedAt = new Date();
        stepResult.duration = stepResult.completedAt.getTime() - (stepResult.startedAt?.getTime() || 0);

        // Update context with output
        if (result.output) {
          Object.assign(context, result.output);
        }
        stepResult.output = result.output;
      } catch (error: unknown) {
        stepResult.status = 'failed';
        stepResult.error = error instanceof Error ? error.message : String(error);
        stepResult.completedAt = new Date();
        stepResult.duration = stepResult.completedAt.getTime() - (stepResult.startedAt?.getTime() || 0);
        steps.push(stepResult);

        return { success: false, context, error: stepResult.error };
      }

      steps.push(stepResult);

      // Check if end node
      if (node.type === 'end') {
        return { success: true, context };
      }

      // Get next nodes
      const nextEdges = this.parser.getNextNodes(currentNodeId, workflow.edges, context);

      if (nextEdges.length === 0) {
        // No more nodes, workflow complete
        return { success: true, context };
      }

      // For now, follow the first valid edge (parallel execution would need more complex handling)
      if (nextEdges.length === 1) {
        currentNodeId = nextEdges[0].to;
      } else {
        // Handle condition branches - find first matching condition
        const validEdge = nextEdges.find(edge => {
          if (edge.condition !== undefined) {
            return this.evaluateSimpleCondition(edge.condition, context);
          }
          return true;
        });

        if (validEdge) {
          currentNodeId = validEdge.to;
        } else {
          // No valid path found
          return { success: true, context };
        }
      }
    }

    if (iterations >= maxIterations) {
      return { success: false, context, error: 'Max iterations exceeded - possible infinite loop' };
    }

    return { success: true, context };
  }

  /**
   * Execute a single node directly
   */
  private async executeNodeDirectly(
    node: any,
    context: Record<string, any>,
    workflow: any
  ): Promise<{ output?: Record<string, any> }> {
    switch (node.type) {
      case 'start':
        return { output: { started: true, timestamp: new Date().toISOString() } };

      case 'end':
        return { output: { completed: true, timestamp: new Date().toISOString() } };

      case 'task':
        const taskConfig = node.config || {};
        // Simulate task execution (in real implementation, this would call an agent)
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          output: {
            taskId: `task-${Date.now()}`,
            agentId: node.agentId || taskConfig.agentId,
            status: 'completed',
            result: taskConfig.expectedResult || 'Task completed successfully',
            timestamp: new Date().toISOString(),
          },
        };

      case 'condition':
        const nextEdges = workflow.edges.get(node.id) || [];
        const conditionResults: Record<string, boolean> = {};
        for (const edge of nextEdges) {
          if (edge.condition !== undefined) {
            conditionResults[edge.to] = this.evaluateSimpleCondition(edge.condition, context);
          }
        }
        return { output: { conditions: conditionResults, timestamp: new Date().toISOString() } };

      case 'parallel':
        const parallelEdges = workflow.edges.get(node.id) || [];
        return {
          output: {
            parallelTasks: parallelEdges.map((e: any) => ({ nodeId: e.to, status: 'queued' })),
            count: parallelEdges.length,
            timestamp: new Date().toISOString(),
          },
        };

      case 'delay':
        const delayMs = Math.min(node.delay || node.config?.delay || 1000, 5000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return { output: { delayed: delayMs, timestamp: new Date().toISOString() } };

      case 'loop':
        const maxIterations = node.config?.maxIterations || 10;
        return { output: { maxIterations, currentIteration: 0, continue: true, timestamp: new Date().toISOString() } };

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Evaluate simple condition
   */
  private evaluateSimpleCondition(condition: boolean | string, variables: Record<string, any>): boolean {
    if (typeof condition === 'boolean') {
      return condition;
    }

    try {
      let expr = condition;
      for (const [key, value] of Object.entries(variables)) {
        expr = expr.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
      }
      return eval(expr);
    } catch {
      return false;
    }
  }
}
