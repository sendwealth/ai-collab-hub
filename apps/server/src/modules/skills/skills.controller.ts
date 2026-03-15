import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import {
  CreateSkillDto,
  UpdateSkillDto,
  SkillQueryDto,
  AddAgentSkillDto,
  UpdateAgentSkillDto,
  AddTaskSkillDto,
  UpdateTaskSkillDto,
} from './dto/skills.dto';

@ApiTags('Skills')
@ApiBearerAuth()
@Controller('api/v1')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // ============================================
  // SkillTag Endpoints
  // ============================================

  @Post('skills')
  @ApiOperation({ summary: '创建技能标签' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误或技能名称已存在' })
  async createSkill(@Body() dto: CreateSkillDto) {
    return this.skillsService.createSkill(dto);
  }

  @Get('skills')
  @ApiOperation({ summary: '获取技能列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAllSkills(@Query() query: SkillQueryDto) {
    return this.skillsService.findAllSkills(query);
  }

  @Get('skills/categories')
  @ApiOperation({ summary: '获取技能分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategories() {
    return this.skillsService.getCategories();
  }

  @Get('skills/statistics')
  @ApiOperation({ summary: '获取技能统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSkillStatistics() {
    return this.skillsService.getSkillStatistics();
  }

  @Get('skills/:id')
  @ApiOperation({ summary: '获取技能详情' })
  @ApiParam({ name: 'id', description: '技能ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '技能不存在' })
  async findSkillById(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsService.findSkillById(id);
  }

  @Put('skills/:id')
  @ApiOperation({ summary: '更新技能' })
  @ApiParam({ name: 'id', description: '技能ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '技能不存在' })
  async updateSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillsService.updateSkill(id, dto);
  }

  @Delete('skills/:id')
  @ApiOperation({ summary: '删除技能' })
  @ApiParam({ name: 'id', description: '技能ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '技能不存在' })
  async deleteSkill(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsService.deleteSkill(id);
  }

  // ============================================
  // Agent Skill Endpoints
  // ============================================

  @Post('agents/:id/skills')
  @ApiOperation({ summary: '为Agent添加技能' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 201, description: '添加成功' })
  @ApiResponse({ status: 404, description: 'Agent或技能不存在' })
  async addAgentSkill(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Body() dto: AddAgentSkillDto,
  ) {
    return this.skillsService.addAgentSkill(agentId, dto);
  }

  @Get('agents/:id/skills')
  @ApiOperation({ summary: '获取Agent的技能列表' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAgentSkills(@Param('id', ParseUUIDPipe) agentId: string) {
    return this.skillsService.getAgentSkills(agentId);
  }

  @Put('agents/:id/skills/:skillId')
  @ApiOperation({ summary: '更新Agent技能' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiParam({ name: 'skillId', description: '技能ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: 'Agent技能不存在' })
  async updateAgentSkill(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Param('skillId', ParseUUIDPipe) skillId: string,
    @Body() dto: UpdateAgentSkillDto,
  ) {
    return this.skillsService.updateAgentSkill(agentId, skillId, dto);
  }

  @Post('agents/:id/skills/:skillId/verify')
  @ApiOperation({ summary: '验证Agent技能' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiParam({ name: 'skillId', description: '技能ID' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 404, description: 'Agent技能不存在' })
  async verifyAgentSkill(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    return this.skillsService.verifyAgentSkill(agentId, skillId);
  }

  @Delete('agents/:id/skills/:skillId')
  @ApiOperation({ summary: '移除Agent技能' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiParam({ name: 'skillId', description: '技能ID' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: 'Agent技能不存在' })
  async removeAgentSkill(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    return this.skillsService.removeAgentSkill(agentId, skillId);
  }

  // ============================================
  // Task Skill Endpoints
  // ============================================

  @Post('tasks/:id/skills')
  @ApiOperation({ summary: '为任务添加技能要求' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 201, description: '添加成功' })
  @ApiResponse({ status: 404, description: '任务或技能不存在' })
  async addTaskSkill(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() dto: AddTaskSkillDto,
  ) {
    return this.skillsService.addTaskSkill(taskId, dto);
  }

  @Get('tasks/:id/skills')
  @ApiOperation({ summary: '获取任务的技能要求' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTaskSkills(@Param('id', ParseUUIDPipe) taskId: string) {
    return this.skillsService.getTaskSkills(taskId);
  }

  @Put('tasks/:id/skills/:skillId')
  @ApiOperation({ summary: '更新任务技能要求' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiParam({ name: 'skillId', description: '技能ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '任务技能不存在' })
  async updateTaskSkill(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Param('skillId', ParseUUIDPipe) skillId: string,
    @Body() dto: UpdateTaskSkillDto,
  ) {
    return this.skillsService.updateTaskSkill(taskId, skillId, dto);
  }

  @Delete('tasks/:id/skills/:skillId')
  @ApiOperation({ summary: '移除任务技能要求' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiParam({ name: 'skillId', description: '技能ID' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: '任务技能不存在' })
  async removeTaskSkill(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    return this.skillsService.removeTaskSkill(taskId, skillId);
  }

  // ============================================
  // Recommendation Endpoints
  // ============================================

  @Post('skills/recommend')
  @ApiOperation({ summary: '根据描述推荐技能' })
  @ApiResponse({ status: 200, description: '推荐成功' })
  async recommendSkills(@Body('description') description: string) {
    return this.skillsService.recommendSkillsForTask(description);
  }
}
