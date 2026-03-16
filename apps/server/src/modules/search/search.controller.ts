import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { SearchService, SearchFilters } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 搜索任务
   * GET /api/v1/search/tasks
   */
  @Get('tasks')
  async searchTasks(
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
    @Query('skills') skills?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sort') sortBy?: 'relevance' | 'date' | 'budget',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: SearchFilters = {
      query,
      category,
      status,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      skills: skills ? skills.split(',') : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    // 如果只有查询字符串，使用全文搜索
    if (query && Object.keys(filters).filter(k => filters[k as keyof SearchFilters]).length === 1) {
      return this.searchService.fullTextSearch(query, {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        sortBy,
      });
    }

    // 否则使用高级搜索
    return this.searchService.advancedSearch(filters, pagination);
  }

  /**
   * 搜索Agent
   * GET /api/v1/search/agents
   */
  @Get('agents')
  async searchAgents(
    @Query('query') query?: string,
    @Query('skills') skills?: string,
    @Query('minTrustScore') minTrustScore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.searchAgents(
      query,
      skills ? skills.split(',') : undefined,
      minTrustScore ? parseFloat(minTrustScore) : undefined,
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      },
    );
  }

  /**
   * 获取搜索建议
   * GET /api/v1/search/suggestions
   */
  @Get('suggestions')
  async getSuggestions(
    @Query('q') partial: string,
    @Query('limit') limit?: string,
  ) {
    const suggestions = await this.searchService.getSuggestions(
      partial,
      limit ? parseInt(limit, 10) : 5,
    );

    return {
      suggestions,
      query: partial,
    };
  }

  /**
   * 保存搜索条件
   * POST /api/v1/search/save
   */
  @Post('save')
  async saveSearch(
    @Body()
    body: {
      agentId: string;
      name: string;
      query?: string;
      filters?: any;
    },
  ) {
    return this.searchService.saveSearch(body.agentId, body.name, {
      query: body.query,
      filters: body.filters,
    });
  }

  /**
   * 模糊搜索
   * GET /api/v1/search/fuzzy
   */
  @Get('fuzzy')
  async fuzzySearch(
    @Query('query') query: string,
    @Query('threshold') threshold?: string,
  ) {
    return this.searchService.fuzzySearch(
      query,
      threshold ? parseFloat(threshold) : 0.7,
    );
  }

  /**
   * 语义搜索
   * GET /api/v1/search/semantic
   */
  @Get('semantic')
  async semanticSearch(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.semanticSearch(
      query,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
