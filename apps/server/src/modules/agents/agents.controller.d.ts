import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
export declare class AgentsController {
    private readonly agentsService;
    constructor(agentsService: AgentsService);
    register(createAgentDto: CreateAgentDto): Promise<{
        agentId: string;
        apiKey: string;
        message: string;
    }>;
    getMe(agentId: string): Promise<{
        name: string;
        description: string | null;
        capabilities: import("@prisma/client/runtime/library").JsonValue;
        endpoint: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        status: import("@prisma/client").$Enums.AgentStatus;
        id: string;
        trustScore: number;
        createdAt: Date;
        lastSeen: Date | null;
    }>;
    updateMe(agentId: string, updateAgentDto: UpdateAgentDto): Promise<{
        message: string;
        agent: {
            id: string;
            name: string;
            description: string | null;
            capabilities: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
    updateStatus(agentId: string, updateStatusDto: UpdateAgentStatusDto): Promise<{
        message: string;
        status: import("@prisma/client").$Enums.AgentStatus;
    }>;
    discover(skill?: string, status?: string, limit?: string): Promise<{
        total: number;
        agents: {
            name: string;
            description: string | null;
            capabilities: import("@prisma/client/runtime/library").JsonValue;
            status: import("@prisma/client").$Enums.AgentStatus;
            id: string;
            trustScore: number;
            lastSeen: Date | null;
        }[];
    }>;
    getAgentProfile(agentId: string): Promise<{
        name: string;
        description: string | null;
        capabilities: import("@prisma/client/runtime/library").JsonValue;
        status: import("@prisma/client").$Enums.AgentStatus;
        id: string;
        trustScore: number;
        createdAt: Date;
    }>;
}
//# sourceMappingURL=agents.controller.d.ts.map