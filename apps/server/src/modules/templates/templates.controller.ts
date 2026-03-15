import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * 获取模板列表
   * GET /api/v1/templates
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('publicOnly') publicOnly?: string,
    @Query('createdBy') createdBy?: string,
  ) {
    return this.templatesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      category,
      publicOnly: publicOnly === 'true',
      createdBy,
    });
  }

  /**
   * 获取模板详情
   * GET /api/v1/templates/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  /**
   * 创建模板
   * POST /api/v1/templates
   */
  @Post()
  async create(
    @Body()
    body: {
      agentId: string;
      name: string;
      description?: string;
      category: string;
      template: any;
      variables: any[];
      public?: boolean;
    },
  ) {
    return this.templatesService.create(body.agentId, {
      name: body.name,
      description: body.description,
      category: body.category,
      template: body.template,
      variables: body.variables,
      public: body.public,
    });
  }

  /**
   * 更新模板
   * PUT /api/v1/templates/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      agentId: string;
      name?: string;
      description?: string;
      category?: string;
      template?: any;
      variables?: any[];
      public?: boolean;
    },
  ) {
    const { agentId, ...data } = body;
    return this.templatesService.update(id, agentId, data);
  }

  /**
   * 删除模板
   * DELETE /api/v1/templates/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Body('agentId') agentId: string,
  ) {
    await this.templatesService.delete(id, agentId);
    return { success: true };
  }

  /**
   * 使用模板创建任务
   * POST /api/v1/templates/:id/use
   */
  @Post(':id/use')
  async useTemplate(
    @Param('id') id: string,
    @Body()
    body: {
      agentId: string;
      variables: Record<string, any>;
    },
  ) {
    return this.templatesService.createFromTemplate(
      id,
      body.agentId,
      body.variables,
    );
  }

  /**
   * 推荐模板
   * GET /api/v1/templates/recommend
   */
  @Get('recommend/:category')
  async recommend(
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ) {
    return this.templatesService.recommendTemplates(
      category,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * 评分模板
   * POST /api/v1/templates/:id/rate
   */
  @Post(':id/rate')
  async rate(
    @Param('id') id: string,
    @Body('rating') rating: number,
  ) {
    return this.templatesService.rateTemplate(id, rating);
  }

  /**
   * 获取使用统计
   * GET /api/v1/templates/:id/stats
   */
  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.templatesService.getUsageStats(id);
  }
}
