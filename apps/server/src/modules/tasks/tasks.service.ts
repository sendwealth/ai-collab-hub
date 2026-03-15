import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../cache';
import { CreateTaskDto, BidTaskDto, SubmitTaskDto, CompleteTaskDto } from './dto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

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
        requirements: createTaskDto.requirements ? JSON.stringify(createTaskDto.requirements) : null,
        reward: createTaskDto.reward ? JSON.stringify(createTaskDto.reward) : JSON.stringify({ credits: 10 }),
        deadline: createTaskDto.deadline ? new Date(createTaskDto.deadline) : null,
        createdById: creatorId,
      },
    });

    // 清除任务列表缓存
    await this.cache.invalidate('tasks:*');

    return {
      taskId: task.id,
      task: {
        ...task,
        requirements: task.requirements ? JSON.parse(task.requirements) : null,
        reward: task.reward ? JSON.parse(task.reward) : null,
      },
    };
  }

  /**
   * 浏览任务 - 带缓存
   */
  async getTasks(filters: {
    status?: string;
    category?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    const cacheKey = `tasks:list:${JSON.stringify(filters)}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: any = {};

        if (filters.status) {
          where.status = filters.status;
        }
        if (filters.category) {
          where.category = filters.category;
        }
        if (filters.type) {
          where.type = filters.type;
        }

        const limit = filters.limit || 20;
        const offset = filters.offset || 0;

        const [tasks, total] = await Promise.all([
          this.prisma.task.findMany({
            where,
            select: { // 使用select优化查询
              id: true,
              title: true,
              description: true,
              type: true,
              category: true,
              requirements: true,
              reward: true,
              status: true,
              createdAt: true,
              deadline: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  trustScore: true,
                },
              },
              assignee: {
                select: {
                  id: true,
                  name: true,
                  trustScore: true,
                },
              },
              _count: {
                select: { bids: true },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
            skip: offset,
          }),
          this.prisma.task.count({ where }),
        ]);

        return {
          total,
          tasks: tasks.map((task) => ({
            ...task,
            requirements: task.requirements ? JSON.parse(task.requirements) : null,
            reward: task.reward ? JSON.parse(task.reward) : null,
            bidCount: task._count.bids,
          })),
        };
      },
      180, // 3分钟缓存
    );
  }

  /**
   * 获取任务详情 - 带缓存
   */
  async getTask(taskId: string) {
    return this.cache.getOrSet(
      `task:detail:${taskId}`,
      async () => {
        const task = await this.prisma.task.findUnique({
          where: { id: taskId },
          select: { // 使用select优化查询
            id: true,
            title: true,
            description: true,
            type: true,
            category: true,
            requirements: true,
            reward: true,
            result: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            deadline: true,
            bids: {
              select: {
                id: true,
                proposal: true,
                estimatedTime: true,
                estimatedCost: true,
                status: true,
                createdAt: true,
                agent: {
                  select: {
                    id: true,
                    name: true,
                    trustScore: true,
                  },
                },
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                trustScore: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                trustScore: true,
              },
            },
          },
        });

        if (!task) {
          throw new NotFoundException('Task not found');
        }

        return {
          ...task,
          requirements: task.requirements ? JSON.parse(task.requirements) : null,
          reward: task.reward ? JSON.parse(task.reward) : null,
          result: task.result ? JSON.parse(task.result) : null,
          bids: task.bids.map((bid) => ({
            ...bid,
          })),
        };
      },
      180, // 3分钟缓存
    );
  }

  /**
   * 竞标任务
   */
  async bidTask(taskId: string, agentId: string, bidTaskDto: BidTaskDto) {
    // 检查任务是否存在
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== 'open') {
      throw new ConflictException('Task is not open for bidding');
    }

    // 检查是否已经竞标
    const existingBid = await this.prisma.bid.findFirst({
      where: {
        taskId,
        agentId,
      },
    });

    if (existingBid) {
      throw new ConflictException('You have already bid on this task');
    }

    const bid = await this.prisma.bid.create({
      data: {
        taskId,
        agentId,
        proposal: bidTaskDto.proposal,
        estimatedTime: bidTaskDto.estimatedTime,
        estimatedCost: bidTaskDto.estimatedCost,
      },
    });

    // 清除任务详情缓存
    await this.cache.del(`task:detail:${taskId}`);

    return {
      bidId: bid.id,
      bid,
    };
  }

  /**
   * 接受竞标
   */
  async acceptBid(taskId: string, bidId: string, agentId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdById !== agentId) {
      throw new ConflictException('Only task creator can accept bids');
    }

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

    // 清除缓存
    await this.cache.del(`task:detail:${taskId}`);
    await this.cache.invalidate('tasks:*');

    return {
      task: {
        ...updatedTask,
        requirements: updatedTask.requirements ? JSON.parse(updatedTask.requirements) : null,
        reward: updatedTask.reward ? JSON.parse(updatedTask.reward) : null,
      },
      bid,
    };
  }

  /**
   * 提交任务结果
   */
  async submitTask(taskId: string, agentId: string, submitTaskDto: SubmitTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.assigneeId !== agentId) {
      throw new ConflictException('Only assignee can submit task');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'reviewing',
        result: submitTaskDto.result ? JSON.stringify(submitTaskDto.result) : null,
      },
    });

    // 清除缓存
    await this.cache.del(`task:detail:${taskId}`);
    await this.cache.invalidate('tasks:*');

    return {
      task: {
        ...updatedTask,
        requirements: updatedTask.requirements ? JSON.parse(updatedTask.requirements) : null,
        reward: updatedTask.reward ? JSON.parse(updatedTask.reward) : null,
        result: updatedTask.result ? JSON.parse(updatedTask.result) : null,
      },
    };
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, agentId: string, completeTaskDto: CompleteTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdById !== agentId) {
      throw new ConflictException('Only task creator can complete task');
    }

    const rating = completeTaskDto.rating || 5;

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        result: JSON.stringify({
          ...((task.result ? JSON.parse(task.result) : {}) as object),
          rating,
        }),
        updatedAt: new Date(),
      },
    });

    // 更新Agent信任分
    if (task.assigneeId) {
      await this.updateAgentTrustScore(task.assigneeId);
    }

    // 清除缓存
    await this.cache.del(`task:detail:${taskId}`);
    await this.cache.invalidate('tasks:*');
    await this.cache.invalidate('agents:*');

    return {
      task: {
        ...updatedTask,
        requirements: updatedTask.requirements ? JSON.parse(updatedTask.requirements) : null,
        reward: updatedTask.reward ? JSON.parse(updatedTask.reward) : null,
        result: updatedTask.result ? JSON.parse(updatedTask.result) : null,
      },
    };
  }

  /**
   * 获取我的任务
   */
  async getMyTasks(agentId: string, filters: { status?: string; role?: string }) {
    const where: any = {};

    if (filters.role === 'creator') {
      where.createdById = agentId;
    } else if (filters.role === 'assignee') {
      where.assigneeId = agentId;
    } else {
      where.OR = [{ createdById: agentId }, { assigneeId: agentId }];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      total: tasks.length,
      tasks: tasks.map((task) => ({
        ...task,
        requirements: task.requirements ? JSON.parse(task.requirements) : null,
        reward: task.reward ? JSON.parse(task.reward) : null,
        bidCount: task._count.bids,
      })),
    };
  }

  /**
   * 更新Agent信任分
   */
  private async updateAgentTrustScore(agentId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: agentId,
        status: 'completed',
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
      (t) => t.result && JSON.parse(t.result).rating,
    );
    const avgQuality =
      ratedTasks.length > 0
        ? ratedTasks.reduce((sum, t) => sum + JSON.parse(t.result!).rating, 0) /
          ratedTasks.length /
          5
        : 0.5;

    // 简单加权
    const trustScore = Math.round(completionRate * 50 + avgQuality * 50);

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { trustScore },
    });
  }
}
