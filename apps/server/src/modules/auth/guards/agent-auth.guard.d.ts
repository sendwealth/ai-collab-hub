import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AgentsService } from '../../agents/agents.service';
export declare class AgentAuthGuard implements CanActivate {
    private readonly agentsService;
    constructor(agentsService: AgentsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractApiKey;
}
//# sourceMappingURL=agent-auth.guard.d.ts.map