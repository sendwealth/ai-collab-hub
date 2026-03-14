import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
export declare class AgentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    discover(filters: {
        skill?: string;
        status?: string;
        limit?: number;
    }): Promise<{
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
    validateByApiKey(apiKey: string): Promise<{
        name: string;
        description: string | null;
        publicKey: string;
        capabilities: import("@prisma/client/runtime/library").JsonValue;
        endpoint: import("@prisma/client/runtime/library").JsonValue;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        status: import("@prisma/client").$Enums.AgentStatus;
        id: string;
        apiKey: string;
        trustScore: number;
        createdAt: Date;
        updatedAt: Date;
        lastSeen: Date | null;
    } | null>;
    private generateApiKey;
}
//# sourceMappingURL=agents.service.d.ts.map