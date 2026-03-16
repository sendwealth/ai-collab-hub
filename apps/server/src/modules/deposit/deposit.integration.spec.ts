import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DepositService } from '../deposit.service';
import { DepositModule } from '../deposit.module';
import {
  DatabaseCleanup,
  TestDataGenerator,
  TestAssertions,
  IntegrationTestHelpers,
} from '../../../test/utils/test-helpers';

describe('Deposit Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: DepositService;
  let cleanup: DatabaseCleanup;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DepositModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    service = app.get<DepositService>(DepositService);
    cleanup = new DatabaseCleanup(prisma);
  });

  afterAll(async () => {
    await cleanup.cleanAllTestData();
    await app.close();
  });

  afterEach(async () => {
    await cleanup.cleanAllTestData();
  });

  describe('Complete Deposit Flow', () => {
    it('should handle full deposit lifecycle: deposit → freeze → deduct → unfreeze → refund', async () => {
      const agentId = 'agent-deposit-flow-1';

      // 1. Initial deposit
      const depositResult = await service.deposit(agentId, 1000, 'Initial deposit');

      TestAssertions.assertHasFields(depositResult, [
        'transactionId',
        'amount',
        'newBalance',
        'previousBalance',
      ]);

      expect(depositResult.amount).toBe(1000);
      expect(depositResult.newBalance).toBe(1000);
      TestAssertions.assertNonNegative(depositResult.newBalance);

      // 2. Freeze some amount
      const freezeResult = await service.freeze(agentId, 300);

      TestAssertions.assertHasFields(freezeResult, [
        'frozenAmount',
        'totalFrozen',
        'availableBalance',
      ]);

      expect(freezeResult.frozenAmount).toBe(300);
      expect(freezeResult.availableBalance).toBe(700); // 1000 - 300

      // 3. Deduct from available balance
      const deductResult = await service.deduct(agentId, 200, 'quality', 'task-1');

      TestAssertions.assertHasFields(deductResult, [
        'amount',
        'newBalance',
        'availableBalance',
        'reason',
      ]);

      expect(deductResult.amount).toBe(200);
      expect(deductResult.newBalance).toBe(800); // 1000 - 200
      expect(deductResult.availableBalance).toBe(500); // 700 - 200

      // 4. Unfreeze
      const unfreezeResult = await service.unfreeze(agentId, 300);

      expect(unfreezeResult.unfrozenAmount).toBe(300);
      expect(unfreezeResult.availableBalance).toBe(800); // 500 + 300

      // 5. Refund
      const refundResult = await service.refund(agentId, 100, 'Task refund', 'task-1');

      TestAssertions.assertHasFields(refundResult, [
        'amount',
        'newBalance',
        'reason',
      ]);

      expect(refundResult.amount).toBe(100);
      expect(refundResult.newBalance).toBe(900); // 800 + 100

      // 6. Verify final state
      const balance = await service.getBalance(agentId);

      expect(balance.balance).toBe(900);
      expect(balance.frozenBalance).toBe(0);
      expect(balance.availableBalance).toBe(900);
    });

    it('should maintain transaction history throughout lifecycle', async () => {
      const agentId = 'agent-history-flow';

      // Perform operations
      await service.deposit(agentId, 1000);
      await service.freeze(agentId, 200);
      await service.deduct(agentId, 100, 'quality', 'task-1');
      await service.unfreeze(agentId, 200);
      await service.refund(agentId, 50, 'Refund', 'task-1');

      // Get transaction history
      const history = await service.getTransactionHistory(agentId, {
        page: 1,
        limit: 20,
      });

      TestAssertions.assertPagination(history, {
        page: 1,
        limit: 20,
        total: expect.any(Number),
      });

      expect(history.transactions).toHaveLength(5);

      // Verify transaction types
      const transactionTypes = history.transactions.map((t) => t.type);
      expect(transactionTypes).toContain('deposit');
      expect(transactionTypes).toContain('freeze');
      expect(transactionTypes).toContain('deduct');
      expect(transactionTypes).toContain('unfreeze');
      expect(transactionTypes).toContain('refund');
    });
  });

  describe('Database Persistence', () => {
    it('should persist deposit data correctly', async () => {
      const agentId = 'agent-persist-test';

      await service.deposit(agentId, 500);

      // Verify in database
      const deposit = await prisma.agentDeposit.findUnique({
        where: { agentId },
      });

      expect(deposit).toBeDefined();
      expect(deposit?.balance).toBe(500);
      expect(deposit?.totalDeposited).toBe(500);
    });

    it('should persist transactions correctly', async () => {
      const agentId = 'agent-txn-persist-test';

      await service.deposit(agentId, 1000, 'Test deposit');

      // Verify transaction in database
      const transactions = await prisma.agentDepositTransaction.findMany({
        where: { agentId },
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('deposit');
      expect(transactions[0].amount).toBe(1000);
      expect(transactions[0].balance).toBe(1000);
    });

    it('should update balance correctly across multiple operations', async () => {
      const agentId = 'agent-balance-update-test';

      await service.deposit(agentId, 1000);
      await service.deduct(agentId, 200, 'quality', 'task-1');
      await service.refund(agentId, 100, 'Refund', 'task-1');

      // Verify final balance
      const deposit = await prisma.agentDeposit.findUnique({
        where: { agentId },
      });

      expect(deposit?.balance).toBe(900); // 1000 - 200 + 100
      expect(deposit?.totalDeducted).toBe(200);
      expect(deposit?.totalRefunded).toBe(100);
    });

    it('should maintain transaction consistency', async () => {
      const agentId = 'agent-txn-consistency-test';

      // Perform multiple operations
      await service.deposit(agentId, 1000);
      await service.deduct(agentId, 100, 'quality', 'task-1');
      await service.deduct(agentId, 150, 'timeout', 'task-2');
      await service.refund(agentId, 50, 'Refund', 'task-1');

      // Get all transactions
      const transactions = await prisma.agentDepositTransaction.findMany({
        where: { agentId },
        orderBy: { createdAt: 'asc' },
      });

      expect(transactions).toHaveLength(4);

      // Verify balance progression
      let runningBalance = 0;
      transactions.forEach((txn) => {
        if (txn.type === 'deposit' || txn.type === 'refund' || txn.type === 'unfreeze') {
          runningBalance += txn.amount;
        } else {
          runningBalance += txn.amount; // amount is negative for deduct/freeze
        }
        expect(txn.balance).toBe(runningBalance);
      });
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent format for getBalance', async () => {
      const agentId = 'agent-balance-format-test';

      await service.deposit(agentId, 1000);
      await service.freeze(agentId, 200);

      const result = await service.getBalance(agentId);

      TestAssertions.assertApiResponse(result, [
        'agentId',
        'balance',
        'frozenBalance',
        'availableBalance',
        'totalDeposited',
        'totalDeducted',
        'totalRefunded',
      ]);

      TestAssertions.assertNonNegative(result.balance);
      TestAssertions.assertNonNegative(result.frozenBalance);
      TestAssertions.assertNonNegative(result.availableBalance);

      expect(result.availableBalance).toBe(result.balance - result.frozenBalance);
    });

    it('should return consistent format for deposit operations', async () => {
      const result = await service.deposit('agent-deposit-format-test', 500);

      TestAssertions.assertApiResponse(result, [
        'transactionId',
        'amount',
        'newBalance',
        'previousBalance',
        'type',
      ]);

      TestAssertions.assertNonNegative(result.amount);
      TestAssertions.assertNonNegative(result.newBalance);
    });

    it('should return consistent format for deduct operations', async () => {
      const agentId = 'agent-deduct-format-test';
      await service.deposit(agentId, 1000);

      const result = await service.deduct(agentId, 200, 'quality', 'task-1');

      TestAssertions.assertApiResponse(result, [
        'transactionId',
        'amount',
        'newBalance',
        'availableBalance',
        'reason',
        'taskId',
      ]);

      expect(result.amount).toBe(200);
      TestAssertions.assertNonNegative(result.availableBalance);
    });

    it('should return consistent format for transaction history', async () => {
      const agentId = 'agent-history-format-test';

      await service.deposit(agentId, 1000);
      await service.deduct(agentId, 100, 'quality', 'task-1');

      const result = await service.getTransactionHistory(agentId, {
        page: 1,
        limit: 20,
      });

      TestAssertions.assertPagination(result, {
        page: 1,
        limit: 20,
        total: expect.any(Number),
      });

      expect(result.transactions).toBeInstanceOf(Array);
      result.transactions.forEach((txn) => {
        TestAssertions.assertApiResponse(txn, [
          'transactionId',
          'type',
          'amount',
          'balance',
          'createdAt',
        ]);
      });
    });

    it('should return consistent format for statistics', async () => {
      const result = await service.getStats();

      TestAssertions.assertApiResponse(result, [
        'totalDeposited',
        'totalDeducted',
        'totalRefunded',
        'totalBalance',
        'totalFrozen',
        'totalAgents',
      ]);

      TestAssertions.assertNonNegative(result.totalDeposited);
      TestAssertions.assertNonNegative(result.totalDeducted);
      TestAssertions.assertNonNegative(result.totalBalance);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle simultaneous deposits', async () => {
      const agentId = 'agent-concurrent-deposit';

      const results = await Promise.all([
        service.deposit(agentId, 500),
        service.deposit(agentId, 300),
        service.deposit(agentId, 200),
      ]);

      // All should succeed
      results.forEach((result) => {
        TestAssertions.assertNonNegative(result.newBalance);
      });

      // Final balance should be 1000
      const balance = await service.getBalance(agentId);
      expect(balance.totalDeposited).toBe(1000);
    });

    it('should handle simultaneous deducts correctly', async () => {
      const agentId = 'agent-concurrent-deduct';

      await service.deposit(agentId, 1000);

      // Try to deduct more than available
      const results = await Promise.allSettled([
        service.deduct(agentId, 400, 'quality', 'task-1'),
        service.deduct(agentId, 400, 'quality', 'task-2'),
        service.deduct(agentId, 400, 'quality', 'task-3'),
      ]);

      // At least one should fail
      const failed = results.filter((r) => r.status === 'rejected');
      expect(failed.length).toBeGreaterThan(0);

      // Balance should not go negative
      const balance = await service.getBalance(agentId);
      TestAssertions.assertNonNegative(balance.balance);
    });

    it('should handle concurrent deposits and deducts', async () => {
      const agentId = 'agent-concurrent-mixed';

      await service.deposit(agentId, 500);

      const results = await Promise.allSettled([
        service.deposit(agentId, 500),
        service.deduct(agentId, 300, 'quality', 'task-1'),
        service.freeze(agentId, 200),
      ]);

      // Verify final state is consistent
      const balance = await service.getBalance(agentId);
      TestAssertions.assertNonNegative(balance.balance);
      TestAssertions.assertNonNegative(balance.availableBalance);
    });
  });

  describe('Balance Calculation Accuracy', () => {
    it('should calculate available balance correctly with frozen funds', async () => {
      const agentId = 'agent-available-calc-test';

      await service.deposit(agentId, 1000);
      await service.freeze(agentId, 300);

      const balance = await service.getBalance(agentId);

      expect(balance.balance).toBe(1000);
      expect(balance.frozenBalance).toBe(300);
      expect(balance.availableBalance).toBe(700);
    });

    it('should track totals accurately across operations', async () => {
      const agentId = 'agent-totals-test';

      await service.deposit(agentId, 1000);
      await service.deposit(agentId, 500);
      await service.deduct(agentId, 200, 'quality', 'task-1');
      await service.deduct(agentId, 150, 'timeout', 'task-2');
      await service.refund(agentId, 100, 'Refund', 'task-1');

      const balance = await service.getBalance(agentId);

      expect(balance.totalDeposited).toBe(1500); // 1000 + 500
      expect(balance.totalDeducted).toBe(350); // 200 + 150
      expect(balance.totalRefunded).toBe(100);
      expect(balance.balance).toBe(1250); // 1500 - 350 + 100
    });

    it('should handle freeze and unfreeze correctly', async () => {
      const agentId = 'agent-freeze-calc-test';

      await service.deposit(agentId, 1000);
      await service.freeze(agentId, 300);
      await service.freeze(agentId, 200);
      await service.unfreeze(agentId, 150);

      const balance = await service.getBalance(agentId);

      expect(balance.frozenBalance).toBe(350); // 300 + 200 - 150
      expect(balance.availableBalance).toBe(650); // 1000 - 350
    });
  });

  describe('Transaction Record Accuracy', () => {
    it('should maintain accurate transaction records', async () => {
      const agentId = 'agent-txn-accuracy-test';

      await service.deposit(agentId, 1000, 'Initial');
      await service.deduct(agentId, 100, 'quality', 'task-1');
      await service.refund(agentId, 50, 'Refund', 'task-1');

      const history = await service.getTransactionHistory(agentId, {
        page: 1,
        limit: 10,
      });

      expect(history.total).toBe(3);

      // Verify each transaction
      expect(history.transactions[0].type).toBe('deposit');
      expect(history.transactions[0].amount).toBe(1000);

      expect(history.transactions[1].type).toBe('deduct');
      expect(history.transactions[1].amount).toBe(-100);

      expect(history.transactions[2].type).toBe('refund');
      expect(history.transactions[2].amount).toBe(50);
    });

    it('should handle transaction pagination correctly', async () => {
      const agentId = 'agent-pagination-test';

      // Create 25 transactions
      for (let i = 0; i < 25; i++) {
        await service.deposit(agentId, 10);
      }

      const page1 = await service.getTransactionHistory(agentId, {
        page: 1,
        limit: 10,
      });

      const page2 = await service.getTransactionHistory(agentId, {
        page: 2,
        limit: 10,
      });

      const page3 = await service.getTransactionHistory(agentId, {
        page: 3,
        limit: 10,
      });

      expect(page1.total).toBe(25);
      expect(page1.transactions).toHaveLength(10);
      expect(page2.transactions).toHaveLength(10);
      expect(page3.transactions).toHaveLength(5);
    });
  });

  describe('Error Handling Integration', () => {
    it('should prevent overdraft', async () => {
      const agentId = 'agent-overdraft-test';

      await service.deposit(agentId, 100);

      await expect(
        service.deduct(agentId, 200, 'quality', 'task-1'),
      ).rejects.toThrow();
    });

    it('should prevent deducting from frozen balance', async () => {
      const agentId = 'agent-frozen-deduct-test';

      await service.deposit(agentId, 1000);
      await service.freeze(agentId, 800);

      // Only 200 available
      await expect(
        service.deduct(agentId, 300, 'quality', 'task-1'),
      ).rejects.toThrow();
    });

    it('should handle non-existent deposit accounts', async () => {
      await expect(
        service.deduct('non-existent-agent', 100, 'quality', 'task-1'),
      ).rejects.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should handle high-volume transactions efficiently', async () => {
      const agentId = 'agent-high-volume-test';

      const { timeMs } = await IntegrationTestHelpers.measureTime(async () => {
        // Create 100 transactions
        for (let i = 0; i < 100; i++) {
          await service.deposit(agentId, 10);
        }
      });

      // Should complete within reasonable time
      expect(timeMs).toBeLessThan(10000); // 10 seconds
    });

    it('should handle concurrent operations efficiently', async () => {
      const agents = Array(50)
        .fill(null)
        .map((_, i) => `agent-perf-${i}`);

      const { totalTimeMs, avgTimeMs } =
        await IntegrationTestHelpers.runConcurrentOperations(
          agents.length,
          (i) => service.deposit(agents[i], 100),
        );

      // Average time should be reasonable
      expect(avgTimeMs).toBeLessThan(500); // 500ms per operation
    });
  });
});
