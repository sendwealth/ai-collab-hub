import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateTaskDto,
  BidTaskDto,
  SubmitTaskDto,
  TaskQueryDto,
} from './dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建任务
   */
  async createTask(creatorId: string, createTaskDto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        type: createTaskDto.type || 'independent',
        category: createTaskDto.category,
        requirements: createTaskDto.requirements || {},
        reward: createTaskDto.reward || { credits: 10 },
        status: 'open',
        createdById: creatorId,
        deadline: createTaskDto.deadline
          ? new Date(createTaskDto.deadline)
          : null,
      },
    });

    return {
      taskId: task.id,
      message: 'Task created successfully',
      task,
    };
  }

  /**
   * 浏览任务
   */
  async getTasks(query: TaskQueryDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.type) {
      where.type = query.type;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        bids: {
          select: {
            id: true,
            agentId: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: query.limit || 20,
      skip: query.offset || 0,
    });

    const total = await this.prisma.task.count({ where });

    return {
      total,
      tasks: tasks.map((task) => ({
        ...task,
        bidCount: task._count.bids,
      })),
    };
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        bids: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                trustScore: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  /**
   * 竞标任务
   */
  async bidTask(agentId: string, taskId: string, bidTaskDto: BidTaskDto) {
    // 检查任务是否存在且状态为open
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== 'open') {
      throw new ConflictException('Task is not open for bidding');
    }

    // 检查是否已经竞标过
    const existingBid = await this.prisma.bid.findFirst({
      where: {
        taskId,
        agentId,
      },
    });

    if (existingBid) {
      throw new ConflictException('You have already bid on this task');
    }

    // 创建竞标
    const bid = await this.prisma.bid.create({
      data: {
        taskId,
        agentId,
        proposal: bidTaskDto.proposal,
        estimatedTime: bidTaskDto.estimatedTime,
        estimatedCost: bidTaskDto.estimatedCost,
        status: 'pending',
      },
    });

    return {
      bidId: bid.id,
      message: 'Bid submitted successfully',
      bid,
    };
  }

  /**
   * 接受竞标（分配任务）
   */
  async acceptBid(creatorId: string, taskId: string, bidId: string) {
    // 检查任务
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdById !== creatorId) {
      throw new ForbiddenException('You are not the creator of this task');
    }

    if (task.status !== 'open') {
      throw new ConflictException('Task is not open');
    }

    // 检查竞标
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
    });

    if (!bid || bid.taskId !== taskId) {
      throw new NotFoundException('Bid not found');
    }

    // 更新任务状态
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'assigned',
        assigneeId: bid.agentId,
      },
    });

    // 更新竞标状态
    await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'accepted' },
    });

    // 拒绝其他竞标
    await this.prisma.bid.updateMany({
      where: {
        taskId,
        id: { not: bidId },
        status: 'pending',
      },
      data: { status: 'rejected' },
    });

    return {
      message: 'Task assigned successfully',
      task: updatedTask,
    };
  }

  /**
   * 提交任务结果
   */
  async submitTask(agentId: string, taskId: string, submitTaskDto: SubmitTaskDto) {
    // 检查任务
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.assigneeId !== agentId) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    if (task.status !== 'assigned') {
      throw new ConflictException('Task is not in assigned status');
    }

    // 更新任务
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'reviewing',
        result: submitTaskDto.result,
      },
    });

    return {
      message: 'Task submitted successfully',
      task: updatedTask,
    };
  }

  /**
   * 完成任务
   */
  async completeTask(creatorId: string, taskId: string, rating?: number) {
    // 检查任务
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdById !== creatorId) {
      throw new ForbiddenException('You are not the creator of this task');
    }

    if (task.status !== 'reviewing') {
      throw new ConflictException('Task is not in reviewing status');
    }

    // 更新任务
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        result: {
          ...((task.result as object) || {}),
          rating,
        },
      },
    });

    // 更新Agent信任分（简单版）
    if (task.assigneeId) {
      await this.updateAgentTrustScore(task.assigneeId);
    }

    return {
      message: 'Task completed successfully',
      task: updatedTask,
    };
  }

  /**
   * 获取Agent的任务
   */
  async getMyTasks(agentId: string, status?: string) {
    const where: any = {
      OR: [
        { createdById: agentId },
        { assigneeId: agentId },
      ],
    };

    if (status) {
      where.status = status;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      total: tasks.length,
      tasks,
    };
  }

  /**
   * 更新Agent信任分（简单版）
   */
  private async updateAgentTrustScore(agentId: string) {
    // 获取Agent的所有任务
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: agentId,
        status: { in: ['completed', 'failed'] },
      },
    });

    if (tasks.length === 0) {
      return;
    }

    // 计算完成率
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const completionRate = completedTasks.length / tasks.length;

    // 计算平均质量（如果有rating）
    const ratedTasks = completedTasks.filter(
      (t) => (t.result as any)?.rating,
    );
    const avgQuality =
      ratedTasks.length > 0
        ? ratedTasks.reduce((sum, t) => sum + (t.result as any).rating, 0) /
          ratedTasks.length / 5
        : 0.5;

    // 简单加权
    const trustScore = Math.round(completionRate * 50 + avgQuality * 50);

    // 更新
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { trustScore },
    });
  }
}
