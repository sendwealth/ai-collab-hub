import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SubtasksService } from './subtasks.service';
import { PricingService } from './pricing.service';
import {
  CreateTaskDto,
  BidTaskDto,
  SubmitTaskDto,
  TaskQueryDto,
  GetPricingDto,
  GetMarketPriceDto,
  CreateSubtaskDto,
  UpdateSubtaskOrderDto,
} from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly subtasksService: SubtasksService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * POST /api/v1/tasks/pricing
   * 获取价格建议
   */
  @Post('pricing')
  async getPricing(@Body() getPricingDto: GetPricingDto) {
    return this.pricingService.suggestPrice(getPricingDto);
  }

  /**
   * GET /api/v1/tasks/pricing/market
   * 获取市场价格参考
   */
  @Get('pricing/market')
  async getMarketPrice(@Query() query: GetMarketPriceDto) {
    return this.pricingService.getMarketPrice(query);
  }

  /**
   * POST /api/v1/tasks
   * 创建任务
   */
  @Post()
  @UseGuards(AgentAuthGuard)
  async createTask(
    @Agent('id') agentId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(agentId, createTaskDto);
  }

  /**
   * GET /api/v1/tasks
   * 浏览任务
   */
  @Get()
  async getTasks(@Query() query: TaskQueryDto) {
    return this.tasksService.getTasks(query);
  }

  /**
   * GET /api/v1/tasks/me
   * 获取我的任务
   */
  @Get('me')
  @UseGuards(AgentAuthGuard)
  async getMyTasks(
    @Agent('id') agentId: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    return this.tasksService.getMyTasks(agentId, { status, role });
  }

  /**
   * GET /api/v1/tasks/:id
   * 获取任务详情
   */
  @Get(':id')
  async getTask(@Param('id') taskId: string) {
    return this.tasksService.getTask(taskId);
  }

  /**
   * POST /api/v1/tasks/:id/bid
   * 竞标任务
   */
  @Post(':id/bid')
  @UseGuards(AgentAuthGuard)
  async bidTask(
    @Agent('id') agentId: string,
    @Param('id') taskId: string,
    @Body() bidTaskDto: BidTaskDto,
  ) {
    return this.tasksService.bidTask(taskId, agentId, bidTaskDto);
  }

  /**
   * POST /api/v1/tasks/:id/accept
   * 接受竞标
   */
  @Post(':id/accept')
  @UseGuards(AgentAuthGuard)
  async acceptBid(
    @Agent('id') agentId: string,
    @Param('id') taskId: string,
    @Body('bidId') bidId: string,
  ) {
    return this.tasksService.acceptBid(taskId, bidId, agentId);
  }

  /**
   * POST /api/v1/tasks/:id/submit
   * 提交任务结果
   */
  @Post(':id/submit')
  @UseGuards(AgentAuthGuard)
  async submitTask(
    @Agent('id') agentId: string,
    @Param('id') taskId: string,
    @Body() submitTaskDto: SubmitTaskDto,
  ) {
    return this.tasksService.submitTask(taskId, agentId, submitTaskDto);
  }

  /**
   * POST /api/v1/tasks/:id/complete
   * 完成任务
   */
  @Post(':id/complete')
  @UseGuards(AgentAuthGuard)
  async completeTask(
    @Agent('id') agentId: string,
    @Param('id') taskId: string,
    @Body('rating') rating?: number,
  ) {
    return this.tasksService.completeTask(taskId, agentId, { rating });
  }

  // ============================================
  // 子任务相关端点
  // ============================================

  /**
   * POST /api/v1/tasks/:id/subtasks
   * 创建子任务
   */
  @Post(':id/subtasks')
  @UseGuards(AgentAuthGuard)
  async createSubtask(
    @Agent('id') agentId: string,
    @Param('id') taskId: string,
    @Body() createSubtaskDto: CreateSubtaskDto,
  ) {
    return this.subtasksService.createSubtask(taskId, agentId, createSubtaskDto);
  }

  /**
   * GET /api/v1/tasks/:id/subtasks
   * 获取子任务列表
   */
  @Get(':id/subtasks')
  async getSubtasks(@Param('id') taskId: string) {
    return this.subtasksService.getSubtasks(taskId);
  }

  /**
   * DELETE /api/v1/tasks/:id/subtasks/:childId
   * 删除子任务关系
   */
  @Delete(':id/subtasks/:childId')
  @UseGuards(AgentAuthGuard)
  async removeSubtask(
    @Agent('id') agentId: string,
    @Param('id') parentId: string,
    @Param('childId') childId: string,
  ) {
    return this.subtasksService.removeSubtask(parentId, childId, agentId);
  }

  /**
   * GET /api/v1/tasks/:id/tree
   * 获取任务树
   */
  @Get(':id/tree')
  async getTaskTree(
    @Param('id') taskId: string,
    @Query('maxDepth') maxDepth?: string,
  ) {
    return this.subtasksService.getTaskTree(
      taskId,
      maxDepth ? parseInt(maxDepth, 10) : 10,
    );
  }

  /**
   * GET /api/v1/tasks/:id/progress
   * 获取任务进度
   */
  @Get(':id/progress')
  async getTaskProgress(@Param('id') taskId: string) {
    return this.subtasksService.calculateProgress(taskId);
  }

  /**
   * POST /api/v1/tasks/:id/subtasks/reorder
   * 更新子任务顺序
   */
  @Post(':id/subtasks/reorder')
  @UseGuards(AgentAuthGuard)
  async updateSubtaskOrder(
    @Agent('id') agentId: string,
    @Param('id') taskId: string,
    @Body() updateOrderDto: UpdateSubtaskOrderDto,
  ) {
    return this.subtasksService.updateSubtaskOrder(
      taskId,
      agentId,
      updateOrderDto.orders,
    );
  }
}
