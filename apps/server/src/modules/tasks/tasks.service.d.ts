import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTaskDto, BidTaskDto, SubmitTaskDto, TaskQueryDto } from './dto';
export declare class TasksService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createTask(creatorId: string, createTaskDto: CreateTaskDto): Promise<{
        taskId: string;
        message: string;
        task: {
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            type: string;
            category: string | null;
            requirements: import("@prisma/client/runtime/library").JsonValue;
            reward: import("@prisma/client/runtime/library").JsonValue;
            deadline: Date | null;
            completedAt: Date | null;
            createdById: string;
            assigneeId: string | null;
        };
    }>;
    getTasks(query: TaskQueryDto): Promise<{
        total: number;
        tasks: any[];
    }>;
    getTask(taskId: string): Promise<{
        bids: ({
            agent: {
                name: string;
                id: string;
                trustScore: number;
            };
        } & {
            status: import("@prisma/client").$Enums.BidStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            proposal: string;
            estimatedTime: number | null;
            estimatedCost: number | null;
            taskId: string;
            agentId: string;
        })[];
    } & {
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        type: string;
        category: string | null;
        requirements: import("@prisma/client/runtime/library").JsonValue;
        reward: import("@prisma/client/runtime/library").JsonValue;
        deadline: Date | null;
        completedAt: Date | null;
        createdById: string;
        assigneeId: string | null;
    }>;
    bidTask(agentId: string, taskId: string, bidTaskDto: BidTaskDto): Promise<{
        bidId: string;
        message: string;
        bid: {
            status: import("@prisma/client").$Enums.BidStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            proposal: string;
            estimatedTime: number | null;
            estimatedCost: number | null;
            taskId: string;
            agentId: string;
        };
    }>;
    acceptBid(creatorId: string, taskId: string, bidId: string): Promise<{
        message: string;
        task: {
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            type: string;
            category: string | null;
            requirements: import("@prisma/client/runtime/library").JsonValue;
            reward: import("@prisma/client/runtime/library").JsonValue;
            deadline: Date | null;
            completedAt: Date | null;
            createdById: string;
            assigneeId: string | null;
        };
    }>;
    submitTask(agentId: string, taskId: string, submitTaskDto: SubmitTaskDto): Promise<{
        message: string;
        task: {
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            type: string;
            category: string | null;
            requirements: import("@prisma/client/runtime/library").JsonValue;
            reward: import("@prisma/client/runtime/library").JsonValue;
            deadline: Date | null;
            completedAt: Date | null;
            createdById: string;
            assigneeId: string | null;
        };
    }>;
    completeTask(creatorId: string, taskId: string, rating?: number): Promise<{
        message: string;
        task: {
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            type: string;
            category: string | null;
            requirements: import("@prisma/client/runtime/library").JsonValue;
            reward: import("@prisma/client/runtime/library").JsonValue;
            deadline: Date | null;
            completedAt: Date | null;
            createdById: string;
            assigneeId: string | null;
        };
    }>;
    getMyTasks(agentId: string, status?: string): Promise<{
        total: number;
        tasks: {
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            result: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            type: string;
            category: string | null;
            requirements: import("@prisma/client/runtime/library").JsonValue;
            reward: import("@prisma/client/runtime/library").JsonValue;
            deadline: Date | null;
            completedAt: Date | null;
            createdById: string;
            assigneeId: string | null;
        }[];
    }>;
    private updateAgentTrustScore;
}
//# sourceMappingURL=tasks.service.d.ts.map