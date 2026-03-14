import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkflowParser, ParsedWorkflow } from '../parser/workflow.parser';
import { WorkflowExecutor, ExecutionContext } from '../executor/workflow.executor';
import { WorkflowDefinitionDto } from '../dto/workflow.dto';

export interface WorkflowState {
  instanceId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentNode: string | null;
  context: Record<string, any>;
  history: Array<{
    nodeId: string;
    timestamp: Date;
    status: string;
  }>;
}

@Injectable()
export class WorkflowEngine implements OnModuleInit {
  private readonly logger = new Logger(WorkflowEngine.name);
  private readonly runningWorkflows = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: WorkflowParser,
    private readonly executor: WorkflowExecutor
  ) {}

  async onModuleInit() {
    // Resume any running workflows from previous session
    await this.resumeRunningWorkflows();
  }

  /**
   * Start a workflow instance
   */
  async startWorkflow(
    templateId: string,
    taskId?: string,
    initialContext?: Record<string, any>
  ): Promise<string> {
    this.logger.log(`Starting workflow from template ${templateId}`);

    // Get template
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    if (!template.isActive) {
      throw new Error(`Template ${templateId} is not active`);
    }

    // Parse workflow definition
    const definition: WorkflowDefinitionDto = JSON.parse(template.definition);
    const parsedWorkflow = this.parser.parse(definition);

    // Create instance
    const instance = await this.prisma.workflowInstance.create({
      data: {
        templateId,
        taskId,
        status: 'pending',
        context: JSON.stringify(initialContext || {}),
        currentNode: parsedWorkflow.startNode,
      },
    });

    // Update template usage count
    await this.prisma.workflowTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    // Start execution
    await this.executeWorkflow(instance.id, parsedWorkflow);

    return instance.id;
  }

  /**
   * Execute workflow
   */
  private async executeWorkflow(instanceId: string, workflow: ParsedWorkflow): Promise<void> {
    this.logger.log(`Executing workflow instance ${instanceId}`);

    // Update status to running
    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Get current state
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const context: ExecutionContext = {
      instanceId,
      variables: JSON.parse(instance.context || '{}'),
      history: [],
      currentNode: instance.currentNode,
    };

    // Execute from current node
    await this.executeFromNode(instance.currentNode || workflow.startNode, context, workflow);
  }

  /**
   * Execute workflow from a specific node
   */
  private async executeFromNode(
    nodeId: string,
    context: ExecutionContext,
    workflow: ParsedWorkflow
  ): Promise<void> {
    let currentNodeId = nodeId;
    let maxIterations = 1000; // Prevent infinite loops
    let iterations = 0;

    while (currentNodeId && iterations < maxIterations) {
      iterations++;

      const node = workflow.nodes.get(currentNodeId);
      if (!node) {
        this.logger.error(`Node ${currentNodeId} not found`);
        await this.failWorkflow(context.instanceId, `Node ${currentNodeId} not found`);
        break;
      }

      // Update current node
      context.currentNode = currentNodeId;
      await this.prisma.workflowInstance.update({
        where: { id: context.instanceId },
        data: { currentNode: currentNodeId },
      });

      // Execute node
      const result = await this.executor.executeNode(node, context, workflow);

      if (!result.success) {
        await this.failWorkflow(context.instanceId, result.error || 'Node execution failed');
        break;
      }

      // Update context with output
      if (result.output) {
        context.variables = { ...context.variables, ...result.output };
        await this.executor.updateContext(context.instanceId, result.output);
      }

      // Add to history
      context.history.push({
        nodeId: currentNodeId,
        timestamp: new Date(),
        status: 'completed',
      });

      // Check if end node
      if (node.type === 'end') {
        await this.completeWorkflow(context.instanceId);
        break;
      }

      // Get next nodes
      const nextNodes = this.parser.getNextNodes(currentNodeId, workflow.edges, context.variables);

      if (nextNodes.length === 0) {
        this.logger.warn(`No next nodes found for ${currentNodeId}, ending workflow`);
        await this.completeWorkflow(context.instanceId);
        break;
      }

      if (nextNodes.length === 1) {
        // Single next node
        currentNodeId = nextNodes[0].to;
      } else {
        // Multiple next nodes (parallel or condition)
        // For now, take the first valid one
        const validEdge = nextNodes.find(edge => {
          if (edge.condition !== undefined) {
            return this.evaluateCondition(edge.condition, context.variables);
          }
          return true;
        });

        if (validEdge) {
          currentNodeId = validEdge.to;
        } else {
          this.logger.warn(`No valid next node found for ${currentNodeId}`);
          await this.completeWorkflow(context.instanceId);
          break;
        }
      }
    }

    if (iterations >= maxIterations) {
      await this.failWorkflow(context.instanceId, 'Max iterations exceeded');
    }
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(instanceId: string): Promise<void> {
    this.logger.log(`Pausing workflow ${instanceId}`);

    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'paused' },
    });

    // Cancel any scheduled execution
    const timeout = this.runningWorkflows.get(instanceId);
    if (timeout) {
      clearTimeout(timeout);
      this.runningWorkflows.delete(instanceId);
    }
  }

  /**
   * Resume workflow
   */
  async resumeWorkflow(instanceId: string): Promise<void> {
    this.logger.log(`Resuming workflow ${instanceId}`);

    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { template: true },
    });

    if (!instance || instance.status !== 'paused') {
      throw new Error(`Cannot resume workflow ${instanceId}`);
    }

    const definition: WorkflowDefinitionDto = JSON.parse(instance.template.definition);
    const parsedWorkflow = this.parser.parse(definition);

    await this.executeWorkflow(instanceId, parsedWorkflow);
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(instanceId: string): Promise<void> {
    this.logger.log(`Cancelling workflow ${instanceId}`);

    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    // Cancel any scheduled execution
    const timeout = this.runningWorkflows.get(instanceId);
    if (timeout) {
      clearTimeout(timeout);
      this.runningWorkflows.delete(instanceId);
    }
  }

  /**
   * Get workflow state
   */
  async getWorkflowState(instanceId: string): Promise<WorkflowState> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        nodeExecutions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    return {
      instanceId: instance.id,
      status: instance.status as any,
      currentNode: instance.currentNode,
      context: JSON.parse(instance.context || '{}'),
      history: instance.nodeExecutions.map(exec => ({
        nodeId: exec.nodeId,
        timestamp: exec.createdAt,
        status: exec.status,
      })),
    };
  }

  /**
   * Complete workflow
   */
  private async completeWorkflow(instanceId: string): Promise<void> {
    this.logger.log(`Completing workflow ${instanceId}`);

    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    this.runningWorkflows.delete(instanceId);
  }

  /**
   * Fail workflow
   */
  private async failWorkflow(instanceId: string, error: string): Promise<void> {
    this.logger.error(`Workflow ${instanceId} failed: ${error}`);

    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'failed',
        errorMessage: error,
        completedAt: new Date(),
      },
    });

    this.runningWorkflows.delete(instanceId);
  }

  /**
   * Resume running workflows from previous session
   */
  private async resumeRunningWorkflows(): Promise<void> {
    const runningInstances = await this.prisma.workflowInstance.findMany({
      where: { status: 'running' },
      include: { template: true },
    });

    this.logger.log(`Found ${runningInstances.length} running workflows to resume`);

    for (const instance of runningInstances) {
      try {
        const definition: WorkflowDefinitionDto = JSON.parse(instance.template.definition);
        const parsedWorkflow = this.parser.parse(definition);

        // Resume from current node
        await this.executeWorkflow(instance.id, parsedWorkflow);
      } catch (error) {
        this.logger.error(`Failed to resume workflow ${instance.id}: ${error.message}`);
        await this.failWorkflow(instance.id, `Resume failed: ${error.message}`);
      }
    }
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
      return false;
    }
  }
}
