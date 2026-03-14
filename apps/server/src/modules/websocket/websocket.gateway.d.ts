import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AgentsService } from '../agents/agents.service';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly agentsService;
    server: Server;
    private logger;
    private connectedAgents;
    constructor(agentsService: AgentsService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    sendToAgent(agentId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    broadcastTaskAvailable(task: any): void;
    notifyTaskAssigned(agentId: string, task: any): void;
    notifyTaskCompleted(agentId: string, task: any): void;
    getOnlineAgentCount(): number;
}
//# sourceMappingURL=websocket.gateway.d.ts.map