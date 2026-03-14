export declare class CreateTaskDto {
    title: string;
    description?: string;
    type?: 'independent' | 'collaborative' | 'workflow';
    category?: string;
    requirements?: {
        skills?: string[];
        minTrustScore?: number;
        maxAgents?: number;
    };
    reward?: {
        credits?: number;
        reputation?: number;
    };
    deadline?: string;
}
export declare class TaskQueryDto {
    status?: string;
    category?: string;
    type?: string;
    limit?: number;
    offset?: number;
}
export declare class BidTaskDto {
    proposal: string;
    estimatedTime?: number;
    estimatedCost?: number;
}
export declare class SubmitTaskDto {
    result: Record<string, any>;
}
//# sourceMappingURL=index.d.ts.map