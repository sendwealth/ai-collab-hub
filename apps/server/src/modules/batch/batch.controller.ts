import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import { TasksService } from '../tasks/tasks.service';

interface BatchRequest {
  method: string;
  path: string;
  params?: any;
}

/**
 * 批量请求控制器 - 提升API效率
 */
@Controller('api/v1/batch')
export class BatchController {
  constructor(
    private agentsService: AgentsService,
    private tasksService: TasksService,
  ) {}

  @Post()
  async batchRequest(@Body() requests: BatchRequest[]) {
    if (!Array.isArray(requests)) {
      throw new BadRequestException('Request body must be an array');
    }

    if (requests.length > 10) {
      throw new BadRequestException('Maximum 10 requests per batch');
    }

    const results = await Promise.all(
      requests.map(async (req) => {
        try {
          return await this.processRequest(req);
        } catch (error) {
          return {
            error: true,
            message: error.message,
            path: req.path,
          };
        }
      })
    );

    return {
      results,
      count: results.length,
    };
  }

  private async processRequest(req: BatchRequest): Promise<any> {
    const { method, path, params } = req;

    // 路由到对应的服务
    if (path.startsWith('/agents')) {
      return this.routeToAgents(method, path, params);
    } else if (path.startsWith('/tasks')) {
      return this.routeToTasks(method, path, params);
    }

    throw new BadRequestException(`Unsupported path: ${path}`);
  }

  private async routeToAgents(method: string, path: string, params: any): Promise<any> {
    if (method === 'GET' && path === '/agents') {
      return this.agentsService.discover(params || {});
    }

    throw new BadRequestException(`Unsupported agent operation: ${method} ${path}`);
  }

  private async routeToTasks(method: string, path: string, params: any): Promise<any> {
    if (method === 'GET' && path === '/tasks') {
      return this.tasksService.getTasks(params || {});
    }

    throw new BadRequestException(`Unsupported task operation: ${method} ${path}`);
  }
}
