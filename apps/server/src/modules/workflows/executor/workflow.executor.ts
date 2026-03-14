import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkflowNodeDto } from '../dto/workflow.dto';
import { ParsedWorkflow } from '../parser/workflow.parser';

export interface WorkflowExecutionContext {
  instanceId: string;
  variables: Record<string, any>;
  history: Array<{ nodeId: string; timestamp: Date; status: string }>;
  currentNode: string | null;
}

@Injectable()
export class WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute a workflow node
   */
  async executeNode(
    node: WorkflowNodeDto,
    context: WorkflowExecutionContext,
    workflow: ParsedWorkflow
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    this.logger.log(`Executing node ${node.id} of type ${node.type}`);

    try {
      // Create node execution record
      const execution = await this.prisma.workflowNodeExecution.create({
        data: {
          instanceId: context.instanceId,
          nodeId: node.id,
          nodeType: node.type,
          status: 'running',
          input: JSON.stringify(context.variables),
          startedAt: new Date(),
        },
      });

      let result: any;

      // Execute based on node type
      switch (node.type) {
        case 'start':
          result = await this.executeStart(node);
          break;

        case 'end':
          result = await this.executeEnd(node, context);
          break;

        case 'task':
          result = await this.executeTask(node);
          break;

        case 'condition':
          result = await this.executeCondition(node, context, workflow);
          break;

        case 'parallel':
          result = await this.executeParallel(node, workflow);
          break;

        case 'delay':
          result = await this.executeDelay(node);
          break;

        case 'loop':
          result = await this.executeLoop(node, context, workflow);
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Update execution record
      const duration = execution.startedAt ? Date.now() - execution.startedAt.getTime() : 0;
      await this.prisma.workflowNodeExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          output: JSON.stringify(result),
          completedAt: new Date(),
          duration,
        },
      });

      return { success: true, output: result };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to execute node ${node.id}: ${errorMsg}`);

      // Update execution record with error
      await this.prisma.workflowNodeExecution.updateMany({
        where: {
          instanceId: context.instanceId,
          nodeId: node.id,
          status: 'running',
        },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date(),
        },
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Execute start node
   */
  private async executeStart(_node: WorkflowNodeDto): Promise<any> {
    return { started: true, timestamp: new Date().toISOString() };
  }

  /**
   * Execute end node
   */
  private async executeEnd(_node: WorkflowNodeDto, context: WorkflowExecutionContext): Promise<any> {
    return {
      completed: true,
      timestamp: new Date().toISOString(),
      finalContext: context.variables,
    };
  }

  /**
   * Execute task node
   */
  private async executeTask(node: WorkflowNodeDto): Promise<any> {
    const agentId = node.agentId || node.config?.agentId;
    this.logger.debug(`Task node ${node.id} assigned to agent ${agentId}`);

    const taskConfig = node.config || {};
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      agentId,
      taskId: `task-${Date.now()}`,
      status: 'completed',
      result: taskConfig.expectedResult || 'Task completed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute condition node
   */
  private async executeCondition(
    node: WorkflowNodeDto,
    context: WorkflowExecutionContext,
    workflow: ParsedWorkflow
  ): Promise<any> {
    this.logger.debug(`Condition node ${node.id}`);

    const nextEdges = workflow.edges.get(node.id) || [];
    const conditionResults: Record<string, boolean> = {};

    for (const edge of nextEdges) {
      if (edge.condition !== undefined) {
        const result = this.evaluateCondition(edge.condition, context.variables);
        conditionResults[edge.to] = result;
      }
    }

    return {
      conditions: conditionResults,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute parallel node
   */
  private async executeParallel(node: WorkflowNodeDto, workflow: ParsedWorkflow): Promise<any> {
    this.logger.debug(`Parallel node ${node.id}`);

    const nextEdges = workflow.edges.get(node.id) || [];
    const parallelResults: any[] = [];

    for (const edge of nextEdges) {
      parallelResults.push({
        nodeId: edge.to,
        status: 'queued',
      });
    }

    return {
      parallelTasks: parallelResults,
      count: parallelResults.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute delay node
   */
  private async executeDelay(node: WorkflowNodeDto): Promise<any> {
    const delayMs = node.delay || node.config?.delay || 1000;
    this.logger.debug(`Delay node ${node.id} waiting for ${delayMs}ms`);

    await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 5000)));

    return {
      delayed: delayMs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute loop node
   */
  private async executeLoop(
    node: WorkflowNodeDto,
    _context: WorkflowExecutionContext,
    _workflow: ParsedWorkflow
  ): Promise<any> {
    const maxIterations = node.config?.maxIterations || 10;
    this.logger.debug(`Loop node ${node.id} with max ${maxIterations} iterations`);

    return {
      maxIterations,
      currentIteration: 0,
      continue: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: boolean | string, variables: Record<string, any>): boolean {
    if (typeof condition === 'boolean') {
      return condition;
    }

    try {
      let expr = condition;
      for (const [key, value] of Object.entries(variables)) {
        expr = expr.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
      }
      return eval(expr);
    } catch (error) {
      this.logger.error(`Failed to evaluate condition: ${condition}`);
      return false;
    }
  }

  /**
   * Update workflow context
   */
  async updateContext(instanceId: string, updates: Record<string, any>): Promise<void> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    const currentContext = JSON.parse(instance.context || '{}');
    const newContext = { ...currentContext, ...updates };

    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { context: JSON.stringify(newContext) },
    });
  }
}
