import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateChecklistDto {
  name: string;
  description?: string;
  required?: boolean;
}

export interface UpdateChecklistDto {
  completed?: boolean;
  completedBy?: string;
}

export interface SubmitReviewDto {
  reviewerId: string;
  checklist: Record<string, any>;
  feedback?: string;
  rating?: number;
}

export interface CreateAutomatedTestDto {
  type: string;
  config: Record<string, any>;
}

export interface TestResultDto {
  status: string;
  result: Record<string, any>;
}

export interface CreateDisputeDto {
  reason: string;
  evidence?: string;
}

@Injectable()
export class QualityAssuranceService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // Quality Checklist Management
  // ============================================

  /**
   * 创建质量检查项
   */
  async createChecklistItem(taskId: string, createDto: CreateChecklistDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 获取最大order
    const maxOrder = await this.prisma.qualityChecklist.aggregate({
      where: { taskId },
      _max: { order: true },
    });

    const order = (maxOrder._max.order || 0) + 1;

    // 注意：Prisma schema中需要添加qualityChecklist表
    // 这里先返回模拟数据
    const item = {
      id: `checklist-${Date.now()}`,
      taskId,
      name: createDto.name,
      description: createDto.description,
      required: createDto.required ?? true,
      completed: false,
      order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return item;
  }

  /**
   * 获取检查清单
   */
  async getChecklist(taskId: string) {
    // 注意：Prisma schema中需要添加qualityChecklist表
    // 这里先返回空数组
    return [];
  }

  /**
   * 更新检查项
   */
  async updateChecklistItem(itemId: string, updateDto: UpdateChecklistDto) {
    // 注意：Prisma schema中需要添加qualityChecklist表
    // 这里先返回模拟数据
    const item = {
      id: itemId,
      completed: updateDto.completed ?? false,
      completedBy: updateDto.completedBy,
      completedAt: updateDto.completed ? new Date() : null,
      updatedAt: new Date(),
    };

    return item;
  }

  /**
   * 验证检查清单
   */
  async validateChecklist(taskId: string) {
    const items = await this.getChecklist(taskId);

    const requiredItems = items.filter((item: any) => item.required);
    const missingItems = requiredItems
      .filter((item: any) => !item.completed)
      .map((item: any) => item.id);

    return {
      valid: missingItems.length === 0,
      totalItems: items.length,
      completedItems: items.filter((item: any) => item.completed).length,
      missingItems,
    };
  }

  // ============================================
  // Quality Review Management
  // ============================================

  /**
   * 提交质量审核
   */
  async submitReview(taskId: string, submitDto: SubmitReviewDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== 'reviewing') {
      throw new BadRequestException(
        'Task must be in reviewing status to submit a review',
      );
    }

    // 注意：Prisma schema中需要添加qualityReview表
    // 这里先返回模拟数据
    const review = {
      id: `review-${Date.now()}`,
      taskId,
      reviewerId: submitDto.reviewerId,
      status: 'PENDING',
      checklist: submitDto.checklist,
      feedback: submitDto.feedback,
      rating: submitDto.rating,
      createdAt: new Date(),
    };

    return review;
  }

  /**
   * 获取审核历史
   */
  async getReviews(taskId: string) {
    // 注意：Prisma schema中需要添加qualityReview表
    // 这里先返回空数组
    return [];
  }

  /**
   * 批准审核
   */
  async approveReview(reviewId: string) {
    // 注意：Prisma schema中需要添加qualityReview表
    // 这里先返回模拟数据
    const review = {
      id: reviewId,
      status: 'APPROVED',
      reviewedAt: new Date(),
    };

    // 更新任务状态
    await this.prisma.task.update({
      where: { id: 'task-id' },
      data: { status: 'completed' },
    });

    return review;
  }

  /**
   * 拒绝审核
   */
  async rejectReview(reviewId: string, feedback: string) {
    // 注意：Prisma schema中需要添加qualityReview表
    // 这里先返回模拟数据
    const review = {
      id: reviewId,
      status: 'REJECTED',
      feedback,
      reviewedAt: new Date(),
    };

    return review;
  }

  /**
   * 计算质量评分
   */
  async calculateQualityScore(taskId: string) {
    const reviews = await this.getReviews(taskId);
    const ratings = reviews
      .map((r: any) => r.rating)
      .filter((r: any) => r !== null && r !== undefined);

    if (ratings.length === 0) {
      return { score: 0, count: 0 };
    }

    const avgScore =
      ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;

    return {
      score: Math.round(avgScore * 100) / 100,
      count: ratings.length,
    };
  }

  // ============================================
  // Automated Test Management
  // ============================================

  /**
   * 创建自动化测试
   */
  async createAutomatedTest(taskId: string, createDto: CreateAutomatedTestDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 注意：Prisma schema中需要添加automatedTest表
    // 这里先返回模拟数据
    const test = {
      id: `test-${Date.now()}`,
      taskId,
      type: createDto.type,
      config: createDto.config,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return test;
  }

  /**
   * 获取自动化测试列表
   */
  async getAutomatedTests(taskId: string) {
    // 注意：Prisma schema中需要添加automatedTest表
    // 这里先返回空数组
    return [];
  }

  /**
   * 更新测试结果
   */
  async updateTestResult(testId: string, result: TestResultDto) {
    // 注意：Prisma schema中需要添加automatedTest表
    // 这里先返回模拟数据
    const test = {
      id: testId,
      status: result.status,
      result: result.result,
      executedAt: new Date(),
      updatedAt: new Date(),
    };

    return test;
  }

  /**
   * 运行所有待执行的测试
   */
  async runAutomatedTests(taskId: string) {
    const tests = await this.getAutomatedTests(taskId);
    const pendingTests = tests.filter((t: any) => t.status === 'PENDING');

    // 标记为运行中
    for (const test of pendingTests) {
      await this.updateTestResult(test.id, {
        status: 'RUNNING',
        result: {},
      });
    }

    return {
      totalTests: pendingTests.length,
      started: true,
    };
  }

  /**
   * 获取测试摘要
   */
  async getTestSummary(taskId: string) {
    // 注意：Prisma schema中需要添加automatedTest表
    // 这里先返回模拟数据
    return {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      running: 0,
      error: 0,
    };
  }

  // ============================================
  // Quality Assurance Workflow
  // ============================================

  /**
   * 启动QA流程
   */
  async startQAProcess(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 验证检查清单
    const validation = await this.validateChecklist(taskId);

    if (!validation.valid) {
      throw new BadRequestException(
        `Checklist not complete. Missing items: ${validation.missingItems.join(', ')}`,
      );
    }

    // 更新任务状态
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'reviewing' },
    });

    return {
      status: updated.status,
      checklistValid: true,
      message: 'QA process started successfully',
    };
  }

  /**
   * 获取QA状态
   */
  async getQAStatus(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 检查清单进度
    const checklistItems = await this.getChecklist(taskId);
    const completedItems = checklistItems.filter((i: any) => i.completed).length;
    const checklistProgress =
      checklistItems.length > 0
        ? (completedItems / checklistItems.length) * 100
        : 0;

    // 审核状态
    const reviews = await this.getReviews(taskId);
    const latestReview = reviews[reviews.length - 1];
    const reviewStatus = latestReview?.status || 'NONE';

    // 测试通过率
    const testSummary = await this.getTestSummary(taskId);
    const testPassRate =
      testSummary.total > 0
        ? (testSummary.passed / testSummary.total) * 100
        : 0;

    return {
      taskStatus: task.status,
      checklistProgress: Math.round(checklistProgress * 100) / 100,
      reviewStatus,
      testPassRate: Math.round(testPassRate * 100) / 100,
      testSummary,
    };
  }

  // ============================================
  // Dispute Resolution
  // ============================================

  /**
   * 创建争议
   */
  async createDispute(reviewId: string, createDto: CreateDisputeDto) {
    // 注意：Prisma schema中需要添加dispute相关字段
    // 这里先返回模拟数据
    const review = {
      id: reviewId,
      status: 'DISPUTED',
      disputeReason: createDto.reason,
      disputeEvidence: createDto.evidence,
      disputedAt: new Date(),
    };

    return review;
  }

  /**
   * 质量保证流程完整执行
   */
  async executeQAWorkflow(taskId: string) {
    // 1. 验证检查清单
    const validation = await this.validateChecklist(taskId);

    // 2. 运行自动化测试
    const testResult = await this.runAutomatedTests(taskId);

    // 3. 获取QA状态
    const qaStatus = await this.getQAStatus(taskId);

    return {
      taskId,
      checklistValid: validation.valid,
      testsStarted: testResult.started,
      qaStatus,
      readyForReview: validation.valid && testResult.started,
    };
  }
}
