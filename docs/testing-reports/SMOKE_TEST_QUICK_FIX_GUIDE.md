# 冒烟测试问题修复指南

**快速参考 - 开发团队使用**

---

## 🚨 需要立即修复的问题

### 1. Dashboard统计接口缺失

**问题**: `GET /api/v1/dashboard/stats` 返回 404

**快速修复**:

```bash
# 1. 创建Dashboard模块
cd apps/server
pnpm nest g module dashboard
pnpm nest g controller dashboard
pnpm nest g service dashboard

# 2. 在 app.module.ts 中注册模块
```

**代码**:
```typescript
// src/dashboard/dashboard.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Agent, Task, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

// src/app.module.ts
@Module({
  imports: [
    // ... 其他模块
    DashboardModule,
  ],
})
export class AppModule {}
```

---

### 2. Dashboard图表接口缺失

**问题**: `GET /api/v1/dashboard/charts` 返回 404

**快速修复**: 与上面一起实现

```typescript
// src/dashboard/dashboard.controller.ts
@Get('charts')
async getCharts() {
  return {
    taskDistribution: await this.dashboardService.getTaskDistribution(),
    agentActivity: await this.dashboardService.getAgentActivity(),
    userGrowth: await this.dashboardService.getUserGrowth(),
  };
}
```

---

### 3. 任务搜索参数不支持

**问题**: `GET /api/v1/tasks?search=test` 返回 400

**快速修复**:

```typescript
// src/task/dto/list-task.dto.ts
export class ListTaskDto {
  // ... 现有字段

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;  // 添加这一行
}

// src/task/task.service.ts
async findAll(query: ListTaskDto) {
  const { page, limit, category, status, search } = query;
  
  const queryBuilder = this.taskRepository.createQueryBuilder('task');
  
  if (search) {
    queryBuilder.andWhere(
      '(task.title ILIKE :search OR task.description ILIKE :search)',
      { search: `%${search}%` }
    );
  }
  
  // ... 其他筛选逻辑
  
  return queryBuilder.getMany();
}
```

---

## 📋 需要尽快完成的功能

### 4. 工作流列表接口

**问题**: `GET /api/v1/workflows` 返回 404

**快速修复**:

```typescript
// src/workflow/workflow.controller.ts
@Get()
async list(@Query() query: ListWorkflowDto) {
  return this.workflowService.findAll(query);
}

@Get(':id')
async get(@Param('id') id: string) {
  return this.workflowService.findOne(id);
}

@Post(':id/run')
async run(@Param('id') id: string) {
  return this.workflowService.run(id);
}
```

---

### 5. 积分查询接口

**问题**: `GET /api/v1/credits` 返回 404

**快速修复**:

```bash
# 创建积分模块
pnpm nest g module credits
pnpm nest g controller credits
pnpm nest g service credits
```

```typescript
// src/credits/credits.controller.ts
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  @Get()
  async getCredits(@User() user: UserEntity) {
    return this.creditsService.getUserCredits(user.id);
  }

  @Get('history')
  async getHistory(@User() user: UserEntity, @Query() query: PaginationDto) {
    return this.creditsService.getHistory(user.id, query);
  }
}
```

---

## 🛠️ 完整实现示例

### Dashboard模块完整代码

```typescript
// src/dashboard/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@ApiTags('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取Dashboard统计数据' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('charts')
  @ApiOperation({ summary: '获取Dashboard图表数据' })
  async getCharts() {
    return this.dashboardService.getCharts();
  }
}

// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Agent) private agentRepo: Repository<Agent>,
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getStats() {
    const [
      totalAgents,
      totalTasks,
      totalUsers,
      activeTasks,
      completedTasks,
    ] = await Promise.all([
      this.agentRepo.count(),
      this.taskRepo.count(),
      this.userRepo.count(),
      this.taskRepo.count({ where: { status: 'open' } }),
      this.taskRepo.count({ where: { status: 'completed' } }),
    ]);

    return {
      totalAgents,
      totalTasks,
      totalUsers,
      activeTasks,
      completedTasks,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0,
    };
  }

  async getCharts() {
    const [
      taskDistribution,
      agentActivity,
      userGrowth,
      creditsUsage,
    ] = await Promise.all([
      this.getTaskDistribution(),
      this.getAgentActivity(),
      this.getUserGrowth(),
      this.getCreditsUsage(),
    ]);

    return {
      taskDistribution,
      agentActivity,
      userGrowth,
      creditsUsage,
    };
  }

  private async getTaskDistribution() {
    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .select('task.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.category')
      .getRawMany();

    return tasks;
  }

  private async getAgentActivity() {
    // 实现Agent活动统计
    const agents = await this.agentRepo
      .createQueryBuilder('agent')
      .select('agent.id', 'id')
      .addSelect('agent.name', 'name')
      .addSelect('COUNT(task.id)', 'taskCount')
      .leftJoin('agent.tasks', 'task')
      .groupBy('agent.id')
      .orderBy('taskCount', 'DESC')
      .limit(10)
      .getRawMany();

    return agents;
  }

  private async getUserGrowth() {
    // 实现用户增长统计
    const users = await this.userRepo
      .createQueryBuilder('user')
      .select("DATE_TRUNC('day', user.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy("DATE_TRUNC('day', user.createdAt)")
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    return users;
  }

  private async getCreditsUsage() {
    // 实现积分使用统计
    return {
      totalEarned: 0,
      totalSpent: 0,
      averagePerTask: 0,
    };
  }
}
```

---

## ✅ 测试验证

修复完成后，运行以下命令验证:

```bash
# 1. 测试Dashboard统计
curl http://localhost:3000/api/v1/dashboard/stats

# 2. 测试Dashboard图表
curl http://localhost:3000/api/v1/dashboard/charts

# 3. 测试任务搜索
curl "http://localhost:3000/api/v1/tasks?search=test"

# 4. 测试工作流列表
curl http://localhost:3000/api/v1/workflows

# 5. 测试积分查询 (需要认证)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/v1/credits
```

---

## 📊 预期结果

修复后，所有接口应返回:

```json
{
  "success": true,
  "data": { ... }
}
```

---

## 🎯 时间估算

- Dashboard模块: 2-3小时
- 任务搜索: 30分钟
- 工作流列表: 1小时
- 积分系统: 1-2小时

**总计**: 4.5-6.5小时

---

## 📞 需要帮助?

如果遇到问题，检查:
1. 数据库实体是否正确定义
2. 模块是否在 app.module.ts 中注册
3. 控制器路由前缀是否正确
4. 依赖注入是否配置正确

---

**最后更新**: 2026-03-16 00:36:00
