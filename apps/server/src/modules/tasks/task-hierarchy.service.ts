import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateSubtaskDto {
  childId?: string;
  title?: string;
  description?: string;
  type?: string;
  category?: string;
  order?: number;
}

export interface UpdateHierarchyDto {
  orders: { childId: string; order: number }[];
}

export interface CreateMilestoneDto {
  name: string;
  description?: string;
  dueDate: string;
}

@Injectable()
export class TaskHierarchyService {
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
    let childTask: any;

    if (createSubtaskDto.childId) {
      // 关联现有任务
      const existingTask = await this.prisma.task.findUnique({
        where: { id: createSubtaskDto.childId },
      });

      if (!existingTask) {
        throw new NotFoundException('Child task not found');
      }

      // 检查循环依赖
      await this.checkCircularDependency(parentId, createSubtaskDto.childId);

      childTaskId = createSubtaskDto.childId;
      childTask = existingTask;
    } else {
      // 创建新任务
      if (!createSubtaskDto.title) {
        throw new BadRequestException('Title is required for new task');
      }

      childTask = await this.prisma.task.create({
        data: {
          title: createSubtaskDto.title,
          description: createSubtaskDto.description,
          type: createSubtaskDto.type || 'independent',
          category: createSubtaskDto.category || parentTask.category,
          level: parentTask.level + 1,
          createdById: agentId,
        },
      });

      childTaskId = childTask.id;
    }

    // 获取最大order
    const maxOrder = await this.prisma.taskRelation.aggregate({
      where: { parentId },
      _max: { order: true },
    });

    const order = createSubtaskDto.order ?? (maxOrder._max.order || 0) + 1;

    // 创建关系
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
      childTask: relation.child,
      order: relation.order,
    };
  }

  /**
   * 获取子任务列表
   */
  async getSubtasks(parentId: string) {
    const relations = await this.prisma.taskRelation.findMany({
      where: { parentId },
      orderBy: { order: 'asc' },
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

    return relations.map((r) => ({
      ...r.child,
      order: r.order,
      parentId: r.parentId,
    }));
  }

  /**
   * 更新任务层级关系（排序）
   */
  async updateHierarchy(parentId: string, updateDto: UpdateHierarchyDto) {
    // 验证所有子任务都属于该父任务
    for (const item of updateDto.orders) {
      const relation = await this.prisma.taskRelation.findUnique({
        where: {
          parentId_childId: {
            parentId,
            childId: item.childId,
          },
        },
      });

      if (!relation) {
        throw new NotFoundException(
          `Task ${item.childId} is not a child of ${parentId}`,
        );
      }
    }

    // 批量更新
    await this.prisma.$transaction(
      updateDto.orders.map((item) =>
        this.prisma.taskRelation.update({
          where: {
            parentId_childId: {
              parentId,
              childId: item.childId,
            },
          },
          data: { order: item.order },
        }),
      ),
    );

    return { success: true };
  }

  /**
   * 添加任务依赖
   */
  async addDependency(taskId: string, dependencyId: string, agentId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdById !== agentId) {
      throw new ConflictException('Only task creator can add dependencies');
    }

    const dependency = await this.prisma.task.findUnique({
      where: { id: dependencyId },
    });

    if (!dependency) {
      throw new NotFoundException('Dependency task not found');
    }

    // 检查循环依赖
    if (await this.hasCircularDependency(taskId, dependencyId)) {
      throw new BadRequestException(
        'Circular dependency detected: this would create a dependency loop',
      );
    }

    // 添加依赖
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        dependencies: [...task.dependencies, dependencyId],
      },
    });

    return {
      taskId: updated.id,
      dependencies: updated.dependencies,
    };
  }

  /**
   * 移除任务依赖
   */
  async removeDependency(
    taskId: string,
    dependencyId: string,
    agentId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdById !== agentId) {
      throw new ConflictException('Only task creator can remove dependencies');
    }

    if (!task.dependencies.includes(dependencyId)) {
      throw new NotFoundException('Dependency not found');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        dependencies: task.dependencies.filter((id) => id !== dependencyId),
      },
    });

    return {
      taskId: updated.id,
      dependencies: updated.dependencies,
    };
  }

  /**
   * 检查循环依赖（递归）
   */
  private async checkCircularDependency(parentId: string, childId: string) {
    // 检查childId的所有祖先是否包含parentId
    const result = await this.prisma.$queryRaw<{ count: bigint }[]>`
      WITH RECURSIVE task_ancestors AS (
        SELECT id, "parentId" FROM task_relations WHERE "childId" = ${childId}
        UNION
        SELECT tr."parentId", tr."childId" FROM task_relations tr
        INNER JOIN task_ancestors ta ON tr."childId" = ta."parentId"
      )
      SELECT COUNT(*) as count FROM task_ancestors WHERE "parentId" = ${parentId}
    `;

    if (result[0].count > 0) {
      throw new BadRequestException(
        'Circular dependency detected: would create a task hierarchy loop',
      );
    }
  }

  /**
   * 检查依赖循环
   */
  private async hasCircularDependency(
    taskId: string,
    dependencyId: string,
  ): Promise<boolean> {
    // 检查dependencyId是否依赖taskId（直接或间接）
    const visited = new Set<string>();
    const queue = [dependencyId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === taskId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const task = await this.prisma.task.findUnique({
        where: { id: current },
        select: { dependencies: true },
      });

      if (task && task.dependencies) {
        queue.push(...task.dependencies);
      }
    }

    return false;
  }

  /**
   * 获取任务树（包括所有后代）
   */
  async getTaskTree(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 获取所有后代任务
    const descendants = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE task_tree AS (
        SELECT id, title, description, level, status, "createdById", "createdAt"
        FROM tasks WHERE id = ${taskId}
        UNION ALL
        SELECT t.id, t.title, t.description, t.level, t.status, t."createdById", t."createdAt"
        FROM tasks t
        INNER JOIN task_relations tr ON t.id = tr."childId"
        INNER JOIN task_tree tt ON tr."parentId" = tt.id
      )
      SELECT * FROM task_tree ORDER BY level, "createdAt"
    `;

    // 构建树结构
    const taskMap = new Map<string, any>();
    descendants.forEach((d) => {
      taskMap.set(d.id, { ...d, children: [] });
    });

    const relations = await this.prisma.taskRelation.findMany({
      where: {
        childId: { in: descendants.map((d) => d.id) },
      },
    });

    relations.forEach((r) => {
      const parent = taskMap.get(r.parentId);
      const child = taskMap.get(r.childId);
      if (parent && child) {
        parent.children.push(child);
      }
    });

    return taskMap.get(taskId);
  }

  /**
   * 获取任务路径（从根到当前任务）
   */
  async getTaskPath(taskId: string) {
    const path = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE task_path AS (
        SELECT id, title, level, "parentId"
        FROM tasks t
        LEFT JOIN task_relations tr ON t.id = tr."childId"
        WHERE t.id = ${taskId}
        UNION ALL
        SELECT t.id, t.title, t.level, tr2."parentId"
        FROM tasks t
        INNER JOIN task_path tp ON t.id = tp."parentId"
        LEFT JOIN task_relations tr2 ON t.id = tr2."childId"
      )
      SELECT id, title, level FROM task_path WHERE id IS NOT NULL ORDER BY level ASC
    `;

    return path;
  }

  /**
   * 传播完成状态（子任务全部完成→父任务自动完成）
   */
  async propagateCompletion(parentId: string) {
    const children = await this.prisma.taskRelation.findMany({
      where: { parentId },
      include: {
        child: {
          select: { status: true },
        },
      },
    });

    if (children.length === 0) {
      return null;
    }

    const allCompleted = children.every(
      (c) => c.child.status === 'completed',
    );

    if (allCompleted) {
      const updated = await this.prisma.task.update({
        where: { id: parentId },
        data: { status: 'completed' },
      });

      return updated;
    }

    return null;
  }

  /**
   * 创建里程碑
   */
  async createMilestone(taskId: string, createDto: CreateMilestoneDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 获取最大order
    const maxOrder = await this.prisma.taskRelation.aggregate({
      where: { parentId: taskId },
      _max: { order: true },
    });

    const order = (maxOrder._max.order || 0) + 1;

    // 注意：Prisma schema中需要添加milestones表
    // 这里先返回模拟数据
    const milestone = {
      id: `milestone-${Date.now()}`,
      taskId,
      name: createDto.name,
      description: createDto.description,
      dueDate: new Date(createDto.dueDate),
      status: 'PENDING',
      order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return milestone;
  }

  /**
   * 获取里程碑列表
   */
  async getMilestones(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 注意：Prisma schema中需要添加milestones表
    // 这里先返回空数组
    return [];
  }

  /**
   * 计算里程碑进度
   */
  async calculateMilestoneProgress(taskId: string) {
    const milestones = await this.getMilestones(taskId);

    const total = milestones.length;
    const completed = milestones.filter(
      (m: any) => m.status === 'COMPLETED',
    ).length;

    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      percentage: Math.round(percentage * 100) / 100,
    };
  }
}
