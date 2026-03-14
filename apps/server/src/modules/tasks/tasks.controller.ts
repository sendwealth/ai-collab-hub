import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  BidTaskDto,
  SubmitTaskDto,
  TaskQueryDto,
} from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

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
}
