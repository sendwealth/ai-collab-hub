import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      agentId: agent.id,
      apiKey: agent.apiKey,
      message: 'Agent registered successfully',
    };
  }

  /**
   * 获取Agent自己的信息
   */
  async getMe(agentId: string) {
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

    return {
      message: 'Status updated successfully',
      status: agent.status,
    };
  }

  /**
   * 发现Agent（根据技能过滤）
   */
  async discover(filters: { skill?: string; status?: string; limit?: number }) {
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
  }

  /**
   * 获取Agent详情（公开信息）
   */
  async getAgentProfile(agentId: string) {
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
}
