import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSubtaskDto } from './dto';

@Injectable()
export class SubtasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建子任务
   */
  async createSubtask(
    parentId: string,
    agentId: string,
    createSubtaskDto: CreateSubtaskDto,
  ) {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentId },
    });

    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    if (parentTask.createdById !== agentId) {
      throw new ConflictException('Only task creator can add subtasks');
    }

    let childTaskId: string;

    if (createSubtaskDto.childId) {
      const childTask = await this.prisma.task.findUnique({
        where: { id: createSubtaskDto.childId },
      });

      if (!childTask) {
        throw new NotFoundException('Child task not found');
      }

      const existingRelation = await this.prisma.taskRelation.findUnique({
        where: {
          parentId_childId: {
            parentId,
            childId: createSubtaskDto.childId,
          },
        },
      });

      if (existingRelation) {
        throw new ConflictException('Task is already a subtask');
      }

      await this.checkCircularDependency(parentId, createSubtaskDto.childId);

      childTaskId = createSubtaskDto.childId;
    } else {
      const newTask = await this.prisma.task.create({
        data: {
          title: createSubtaskDto.title!,
          description: createSubtaskDto.description,
          type: createSubtaskDto.type || 'independent',
          category: createSubtaskDto.category || parentTask.category,
          createdById: agentId,
        },
      });

      childTaskId = newTask.id;
    }

    const maxOrder = await this.prisma.taskRelation.aggregate({
      where: { parentId },
      _max: { order: true },
    });

    const order = createSubtaskDto.order ?? (maxOrder._max.order || 0) + 1;

    const relation = await this.prisma.taskRelation.create({
      data: {
        parentId,
        childId: childTaskId,
        order,
      },
      include: {
        child: {
          include: {
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
        },
      },
    });

    return {
      relationId: relation.id,
      subtask: {
        ...relation.child,
        requirements: relation.child.requirements
          ? JSON.parse(relation.child.requirements)
          : null,
        reward: relation.child.reward
          ? JSON.parse(relation.child.reward)
          : null,
        order: relation.order,
      },
    };
  }

  /**
   * 获取子任务列表
   */
  async getSubtasks(parentId: string) {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentId },
    });

    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    const relations = await this.prisma.taskRelation.findMany({
      where: { parentId },
      include: {
        child: {
          include: {
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
              select: { bids: true, childRelations: true },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    const subtasks = relations.map((relation) => ({
      ...relation.child,
      requirements: relation.child.requirements
        ? JSON.parse(relation.child.requirements)
        : null,
      reward: relation.child.reward
        ? JSON.parse(relation.child.reward)
        : null,
      order: relation.order,
      bidCount: relation.child._count.bids,
      subtaskCount: relation.child._count.childRelations,
    }));

    const progress = await this.calculateProgress(parentId);

    return {
      total: subtasks.length,
      progress,
      subtasks,
    };
  }

  /**
   * 删除子任务关系
   */
  async removeSubtask(parentId: string, childId: string, agentId: string) {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentId },
    });

    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    if (parentTask.createdById !== agentId) {
      throw new ConflictException('Only task creator can remove subtasks');
    }

    const relation = await this.prisma.taskRelation.findUnique({
      where: {
        parentId_childId: { parentId, childId },
      },
    });

    if (!relation) {
      throw new NotFoundException('Subtask relation not found');
    }

    await this.prisma.taskRelation.delete({
      where: {
        parentId_childId: { parentId, childId },
      },
    });

    return { success: true };
  }

  /**
   * 获取任务树
   */
  async getTaskTree(taskId: string, maxDepth: number = 10) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
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

    const buildTree = async (id: string, depth: number): Promise<any> => {
      if (depth > maxDepth) return null;

      const node = await this.prisma.task.findUnique({
        where: { id },
        include: {
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
          childRelations: {
            include: {
              child: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!node) return null;

      const children = await Promise.all(
        node.childRelations.map(async (relation) => {
          return buildTree(relation.childId, depth + 1);
        }),
      );

      const progress = await this.calculateProgress(id);

      return {
        ...node,
        requirements: node.requirements
          ? JSON.parse(node.requirements)
          : null,
        reward: node.reward ? JSON.parse(node.reward) : null,
        result: node.result ? JSON.parse(node.result) : null,
        progress,
        children: children.filter(Boolean),
      };
    };

    const tree = await buildTree(taskId, 0);

    return { tree };
  }

  /**
   * 计算任务进度
   */
  async calculateProgress(taskId: string): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    const subtasks = await this.prisma.taskRelation.findMany({
      where: { parentId: taskId },
      include: {
        child: true,
      },
    });

    if (subtasks.length === 0) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });

      const isCompleted = task?.status === 'completed';
      return {
        total: 1,
        completed: isCompleted ? 1 : 0,
        percentage: isCompleted ? 100 : 0,
      };
    }

    let total = 0;
    let completed = 0;

    for (const subtask of subtasks) {
      const childProgress = await this.calculateProgress(subtask.childId);
      total += childProgress.total;
      completed += childProgress.completed;
    }

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * 更新子任务顺序
   */
  async updateSubtaskOrder(
    parentId: string,
    agentId: string,
    orders: { childId: string; order: number }[],
  ) {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentId },
    });

    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    if (parentTask.createdById !== agentId) {
      throw new ConflictException('Only task creator can reorder subtasks');
    }

    const updates = orders.map((item) =>
      this.prisma.taskRelation.update({
        where: {
          parentId_childId: {
            parentId,
            childId: item.childId,
          },
        },
        data: {
          order: item.order,
        },
      }),
    );

    await Promise.all(updates);

    return { success: true };
  }

  /**
   * 检查循环依赖
   */
  private async checkCircularDependency(
    parentId: string,
    childId: string,
    visited: Set<string> = new Set(),
  ): Promise<void> {
    if (parentId === childId) {
      throw new BadRequestException('Cannot create circular dependency');
    }

    if (visited.has(childId)) {
      throw new BadRequestException('Circular dependency detected');
    }

    visited.add(childId);

    const childSubtasks = await this.prisma.taskRelation.findMany({
      where: { parentId: childId },
      select: { childId: true },
    });

    for (const subtask of childSubtasks) {
      await this.checkCircularDependency(parentId, subtask.childId, visited);
    }
  }
}
