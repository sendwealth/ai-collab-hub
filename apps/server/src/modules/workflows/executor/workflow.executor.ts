import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkflowNodeDto, WorkflowEdgeDto } from '../dto/workflow.dto';
import { ParsedWorkflow } from '../parser/workflow.parser';

export interface ExecutionContext {
  instanceId: string;
  variables: Record<string, any>;
  history: string[];
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
    context: ExecutionContext,
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
      let success = true;

      // Execute based on node type
      switch (node.type) {
        case 'start':
          result = await this.executeStart(node, context);
          break;

        case 'end':
          result = await this.executeEnd(node, context);
          break;

        case 'task':
          result = await this.executeTask(node, context);
          break;

        case 'condition':
          result = await this.executeCondition(node, context, workflow);
          break;

        case 'parallel':
          result = await this.executeParallel(node, context, workflow);
          break;

        case 'delay':
          result = await this.executeDelay(node, context);
          break;

        case 'loop':
          result = await this.executeLoop(node, context, workflow);
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Update execution record
      await this.prisma.workflowNodeExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          output: JSON.stringify(result),
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt.getTime(),
        },
      });

      return { success: true, output: result };
    } catch (error) {
      this.logger.error(`Failed to execute node ${node.id}: ${error.message}`);

      // Update execution record with error
      await this.prisma.workflowNodeExecution.updateMany({
        where: {
          instanceId: context.instanceId,
          nodeId: node.id,
          status: 'running',
        },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Execute start node
   */
  private async executeStart(node: WorkflowNodeDto, context: ExecutionContext): Promise<any> {
    this.logger.debug(`Start node ${node.id}`);
    return { started: true, timestamp: new Date().toISOString() };
  }

  /**
   * Execute end node
   */
  private async executeEnd(node: WorkflowNodeDto, context: ExecutionContext): Promise<any> {
    this.logger.debug(`End node ${node.id}`);
    return {
      completed: true,
      timestamp: new Date().toISOString(),
      finalContext: context.variables,
    };
  }

  /**
   * Execute task node
   */
  private async executeTask(node: WorkflowNodeDto, context: ExecutionContext): Promise<any> {
    const agentId = node.agentId || node.config?.agentId;
    this.logger.debug(`Task node ${node.id} assigned to agent ${agentId}`);

    // In a real implementation, this would call the agent API
    // For now, we simulate task execution
    const taskConfig = node.config || {};

    // Simulate task execution delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return simulated result
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
    context: ExecutionContext,
    workflow: ParsedWorkflow
  ): Promise<any> {
    this.logger.debug(`Condition node ${node.id}`);

    // Get next edges with conditions
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
  private async executeParallel(
    node: WorkflowNodeDto,
    context: ExecutionContext,
    workflow: ParsedWorkflow
  ): Promise<any> {
    this.logger.debug(`Parallel node ${node.id}`);

    const nextEdges = workflow.edges.get(node.id) || [];
    const parallelResults: any[] = [];

    // In a real implementation, this would execute tasks in parallel
    // For now, we simulate parallel execution
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
  private async executeDelay(node: WorkflowNodeDto, context: ExecutionContext): Promise<any> {
    const delayMs = node.delay || node.config?.delay || 1000;
    this.logger.debug(`Delay node ${node.id} waiting for ${delayMs}ms`);

    await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 5000))); // Cap at 5s for safety

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
    context: ExecutionContext,
    workflow: ParsedWorkflow
  ): Promise<any> {
    const maxIterations = node.config?.maxIterations || 10;
    this.logger.debug(`Loop node ${node.id} with max ${maxIterations} iterations`);

    // In a real implementation, this would execute the loop body
    // For now, we return loop metadata
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
      // Simple expression evaluation
      let expr = condition;
      for (const [key, value] of Object.entries(variables)) {
        expr = expr.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
      }

      // Basic safe evaluation
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
