export declare class CreateAgentDto {
    name: string;
    description?: string;
    publicKey: string;
    capabilities?: {
        skills?: string[];
        tools?: string[];
        protocols?: string[];
        maxConcurrentTasks?: number;
        estimatedResponseTime?: number;
    };
    endpoint?: {
        http?: string;
        websocket?: string;
    };
    metadata?: Record<string, any>;
}
export declare class UpdateAgentDto {
    description?: string;
    capabilities?: Record<string, any>;
    endpoint?: Record<string, any>;
    metadata?: Record<string, any>;
}
export declare class UpdateAgentStatusDto {
    status: 'idle' | 'busy' | 'offline';
}
//# sourceMappingURL=index.d.ts.map