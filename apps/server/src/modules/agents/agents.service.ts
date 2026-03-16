import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../cache';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Agent注册
   */
  async register(createAgentDto: CreateAgentDto) {
    // 检查name是否已存在
    const existingAgent = await this.prisma.agent.findFirst({
      where: { name: createAgentDto.name },
    });

    if (existingAgent) {
      throw new ConflictException('Agent name already exists');
    }

    // 生成API Key
    const apiKey = this.generateApiKey();

    // 创建Agent
    const agent = await this.prisma.agent.create({
      data: {
        name: createAgentDto.name,
        description: createAgentDto.description,
        publicKey: createAgentDto.publicKey,
        capabilities: createAgentDto.capabilities ? JSON.stringify(createAgentDto.capabilities) : null,
        endpoint: createAgentDto.endpoint ? JSON.stringify(createAgentDto.endpoint) : null,
        metadata: createAgentDto.metadata ? JSON.stringify(createAgentDto.metadata) : null,
        apiKey,
        status: 'idle',
        trustScore: 0,
      },
    });

    // 清除agent列表缓存（失败不影响主流程）
    try {
      await this.cache.invalidate('agents:*');
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }

    return {
      agentId: agent.id,
      apiKey: agent.apiKey,
      message: 'Agent registered successfully',
    };
  }

  /**
   * 获取Agent自己的信息（带缓存）
   */
  async getMe(agentId: string) {
    return this.cache.getOrSet(
      `agent:me:${agentId}`,
      async () => {
        const agent = await this.prisma.agent.findUnique({
          where: { id: agentId },
          select: {
            id: true,
            name: true,
            description: true,
            capabilities: true,
            endpoint: true,
            metadata: true,
            status: true,
            trustScore: true,
            createdAt: true,
            lastSeen: true,
          },
        });

        if (!agent) {
          throw new NotFoundException('Agent not found');
        }

        return agent;
      },
      600, // 10分钟缓存
    );
  }

  /**
   * 更新Agent信息
   */
  async updateMe(agentId: string, updateAgentDto: UpdateAgentDto) {
    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        ...updateAgentDto,
        updatedAt: new Date(),
      },
    });

    // 清除相关缓存
    await this.cache.del(`agent:me:${agentId}`);
    await this.cache.del(`agent:profile:${agentId}`);
    await this.cache.invalidate('agents:*');

    return {
      message: 'Agent updated successfully',
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
      },
    };
  }

  /**
   * 更新Agent状态
   */
  async updateStatus(agentId: string, updateStatusDto: UpdateAgentStatusDto) {
    const agent = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        status: updateStatusDto.status,
        lastSeen: new Date(),
      },
    });

    // 清除缓存
    await this.cache.del(`agent:me:${agentId}`);
    await this.cache.invalidate('agents:*');

    return {
      message: 'Status updated successfully',
      status: agent.status,
    };
  }

  /**
   * 发现Agent（根据技能过滤）- 带缓存
   */
  async discover(filters: { skill?: string; status?: string; limit?: number }) {
    const cacheKey = `agents:discover:${JSON.stringify(filters)}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: any = {};

        if (filters.status) {
          where.status = filters.status;
        }

        if (filters.skill) {
          where.capabilities = {
            path: ['skills'],
            array_contains: [filters.skill],
          };
        }

        const agents = await this.prisma.agent.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            capabilities: true,
            status: true,
            trustScore: true,
            lastSeen: true,
          },
          take: filters.limit || 20,
          orderBy: {
            trustScore: 'desc',
          },
        });

        return {
          total: agents.length,
          agents,
        };
      },
      300, // 5分钟缓存
    );
  }

  /**
   * 获取Agent详情（公开信息）- 带缓存
   */
  async getAgentProfile(agentId: string) {
    return this.cache.getOrSet(
      `agent:profile:${agentId}`,
      async () => {
        const agent = await this.prisma.agent.findUnique({
          where: { id: agentId },
          select: {
            id: true,
            name: true,
            description: true,
            capabilities: true,
            status: true,
            trustScore: true,
            createdAt: true,
            // 不暴露敏感信息
          },
        });

        if (!agent) {
          throw new NotFoundException('Agent not found');
        }

        return agent;
      },
      600, // 10分钟缓存
    );
  }

  /**
   * 根据API Key验证Agent
   */
  async validateByApiKey(apiKey: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { apiKey },
    });

    if (!agent) {
      return null;
    }

    // 更新lastSeen
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { lastSeen: new Date() },
    });

    return agent;
  }

  /**
   * 生成API Key
   */
  private generateApiKey(): string {
    return `sk_agent_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * 删除Agent
   */
  async deleteAgent(currentAgentId: string, agentId: string) {
    // 只能删除自己
    if (currentAgentId !== agentId) {
      throw new ConflictException('Can only delete your own account');
    }

    // 检查是否有进行中的任务
    const activeTasks = await this.prisma.task.count({
      where: {
        OR: [
          { createdById: agentId },
          { assigneeId: agentId },
        ],
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
    });

    if (activeTasks > 0) {
      throw new ConflictException('Cannot delete agent with active tasks');
    }

    // 删除Agent
    await this.prisma.agent.delete({
      where: { id: agentId },
    });

    // 清除缓存
    await this.cache.del(`agent:me:${agentId}`);
    await this.cache.del(`agent:profile:${agentId}`);
    await this.cache.invalidate('agents:*');

    return {
      success: true,
      message: 'Agent deleted successfully',
    };
  }

  /**
   * 获取Agent任务
   */
  async getAgentTasks(
    agentId: string,
    query: { status?: string; page: number; limit: number },
  ) {
    const skip = (query.page - 1) * query.limit;

    const where: any = {
      OR: [
        { createdById: agentId },
        { assigneeId: agentId },
      ],
    };

    if (query.status) {
      where.status = query.status;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          budget: true,
          category: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      success: true,
      data: tasks,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * 获取Agent评分
   */
  async getAgentRatings(
    agentId: string,
    query: { page: number; limit: number },
  ) {
    const skip = (query.page - 1) * query.limit;

    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { toAgentId: agentId },
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.rating.count({ where: { toAgentId: agentId } }),
    ]);

    return {
      success: true,
      data: ratings,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
