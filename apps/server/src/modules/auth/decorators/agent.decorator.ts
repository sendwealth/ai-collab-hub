import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Agent = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const agent = request.agent;

    return data ? agent?.[data] : agent;
  },
);
