import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AgentsService } from '../../agents/agents.service';

@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(private readonly agentsService: AgentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const agent = await this.agentsService.validateByApiKey(apiKey);

    if (!agent) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 将agent信息附加到request
    request.agent = agent;

    return true;
  }

  private extractApiKey(request: any): string | null {
    // 从header获取
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');
    
    return apiKey || null;
  }
}
