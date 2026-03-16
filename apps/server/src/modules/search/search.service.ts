import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../cache';

export interface SearchOptions {
  limit?: number;
  offset?: number;
  page?: number;
  sortBy?: 'relevance' | 'date' | 'budget';
}

export interface SearchFilters {
  query?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  skills?: string[];
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchResult {
  tasks: any[];
  total: number;
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * 全文搜索
   */
  async fullTextSearch(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult> {
    if (!query || query.trim() === '') {
      return { tasks: [], total: 0 };
    }

    const cacheKey = `search:fulltext:${query}:${JSON.stringify(options)}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const tokens = this.tokenize(query);
        const limit = options.limit || 20;
        const offset = options.offset || 0;

        // 使用PostgreSQL全文搜索（通过$queryRaw）
        const searchQuery = tokens.join(' & ');
        
        const tasks = await this.prisma.$queryRaw<any[]>`
          SELECT * FROM tasks
          WHERE to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
          @@ to_tsquery('english', ${searchQuery})
          ORDER BY 
            CASE 
              WHEN title ILIKE ${'%' + query + '%'} THEN 0
              ELSE 1
            END,
            created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;

        const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM tasks
          WHERE to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
          @@ to_tsquery('english', ${searchQuery})
        `;

        const total = Number(countResult[0].count);

        return {
          tasks: tasks.map(task => ({
            ...task,
            requirements: task.requirements ? JSON.parse(task.requirements) : null,
            reward: task.reward ? JSON.parse(task.reward) : null,
            result: task.result ? JSON.parse(task.result) : null,
          })),
          total,
        };
      },
      300, // 5分钟缓存
    );
  }

  /**
   * 多条件组合搜索
   */
  async advancedSearch(
    filters: SearchFilters,
    pagination: { page?: number; limit?: number } = {},
  ): Promise<any[]> {
    const where: any = {};

    // 类别筛选
    if (filters.category) {
      where.category = filters.category;
    }

    // 状态筛选
    if (filters.status) {
      where.status = filters.status;
    }

    // 日期范围
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // 关键词搜索
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    const tasks = await this.prisma.task.findMany({
      where,
      take: limit,
      skip: offset,
    });

    // 在应用层过滤预算和技能（因为存储为JSON字符串）
    let filtered = tasks.map(task => ({
      ...task,
      requirements: task.requirements ? JSON.parse(task.requirements) : null,
      reward: task.reward ? JSON.parse(task.reward) : null,
      result: task.result ? JSON.parse(task.result) : null,
    }));

    // 预算筛选
    if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
      filtered = filtered.filter(task => {
        const requirements = task.requirements as any;
        if (!requirements || !requirements.budget) return false;

        const budget = requirements.budget;
        const minMatch = filters.budgetMin === undefined || budget.min >= filters.budgetMin;
        const maxMatch = filters.budgetMax === undefined || budget.max <= filters.budgetMax;

        return minMatch && maxMatch;
      });
    }

    // 技能筛选
    if (filters.skills && filters.skills.length > 0) {
      filtered = filtered.filter(task => {
        const requirements = task.requirements as any;
        if (!requirements || !requirements.skills) return false;

        return filters.skills!.some(skill =>
          requirements.skills.includes(skill),
        );
      });
    }

    return filtered;
  }

  /**
   * 模糊搜索（基于Levenshtein距离）
   */
  async fuzzySearch(query: string, threshold: number = 0.7): Promise<any[]> {
    const tasks = await this.prisma.task.findMany();

    const results = tasks
      .filter(task => {
        const similarity = this.calculateSimilarity(
          query.toLowerCase(),
          task.title.toLowerCase(),
        );
        return similarity >= threshold;
      })
      .map(task => ({
        ...task,
        requirements: task.requirements ? JSON.parse(task.requirements) : null,
        reward: task.reward ? JSON.parse(task.reward) : null,
        result: task.result ? JSON.parse(task.result) : null,
        similarity: this.calculateSimilarity(
          query.toLowerCase(),
          task.title.toLowerCase(),
        ),
      }))
      .sort((a, b) => (b as any).similarity - (a as any).similarity);

    return results;
  }

  /**
   * 语义搜索（AI增强）
   */
  async semanticSearch(query: string, limit: number = 10): Promise<any[]> {
    // 生成查询向量
    const queryEmbedding = await this.generateEmbedding(query);

    // 获取所有有向量的任务
    const tasks = await this.prisma.task.findMany({
      where: {
        NOT: {
          requirements: null,
        },
      },
    });

    // 计算相似度并排序
    const results = tasks
      .map(task => {
        // 从requirements中提取embedding（如果有）
        const requirements = task.requirements
          ? JSON.parse(task.requirements)
          : null;
        const embedding = requirements?.embedding || null;

        if (!embedding) {
          return { task, similarity: 0 };
        }

        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        return {
          task: {
            ...task,
            requirements,
            reward: task.reward ? JSON.parse(task.reward) : null,
            result: task.result ? JSON.parse(task.result) : null,
          },
          similarity,
        };
      })
      .filter(r => r.similarity > 0.5) // 只返回相似度 > 0.5 的结果
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(r => r.task);

    return results;
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(partial: string, limit: number = 5): Promise<string[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        title: {
          contains: partial,
          mode: 'insensitive',
        },
      },
      take: 50,
    });

    const suggestions = tasks
      .map(task => task.title)
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, limit);

    return suggestions;
  }

  /**
   * 保存搜索条件
   */
  async saveSearch(
    agentId: string,
    name: string,
    searchCriteria: any,
  ): Promise<any> {
    return this.prisma.savedSearch.create({
      data: {
        agentId,
        name,
        query: searchCriteria.query,
        filters: JSON.stringify(searchCriteria.filters || {}),
      },
    });
  }

  /**
   * 分词
   */
  tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * 计算字符串相似度（基于Levenshtein距离）
   */
  calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    const dp: number[][] = Array.from({ length: len1 + 1 }, () =>
      Array(len2 + 1).fill(0),
    );

    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1, // 删除
            dp[i][j - 1] + 1, // 插入
            dp[i - 1][j - 1] + 1, // 替换
          );
        }
      }
    }

    const distance = dp[len1][len2];
    const maxLength = Math.max(len1, len2);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * 生成文本向量（用于语义搜索）
   */
  async generateEmbedding(_text: string): Promise<number[]> {
    // 这里预留OpenAI API调用接口
    // 实际实现需要配置OpenAI API密钥
    // const response = await this.openai.embeddings.create({
    //   model: 'text-embedding-ada-002',
    //   input: text,
    // });
    // return response.data[0].embedding;

    // 临时：返回模拟向量
    return new Array(1536).fill(0).map(() => Math.random());
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * 搜索Agent
   */
  async searchAgents(
    query?: string,
    skills?: string[],
    minTrustScore?: number,
    options: { page?: number; limit?: number } = {},
  ): Promise<any> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};

    // 按信任分数过滤
    if (minTrustScore !== undefined) {
      where.trustScore = {
        gte: minTrustScore,
      };
    }

    // 按技能过滤
    if (skills && skills.length > 0) {
      // 假设技能存储在capabilities字段中
      // 这里简化处理，实际可能需要JSON查询
      where.OR = skills.map(skill => ({
        capabilities: {
          path: ['skills'],
          array_contains: [skill],
        },
      }));
    }

    // 文本搜索
    if (query) {
      where.OR = where.OR || [];
      where.OR.push(
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
      );
    }

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          capabilities: true,
          status: true,
          trustScore: true,
          createdAt: true,
        },
        skip: offset,
        take: limit,
        orderBy: {
          trustScore: 'desc',
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      success: true,
      data: agents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 使搜索缓存失效
   */
  async invalidateSearchCache(): Promise<void> {
    await this.cache.invalidate('search:*');
  }
}
