import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentCertificationService } from '../agent-certification.service';
import { AgentTestingModule } from '../../agent-testing/agent-testing.module';
import { AgentCertificationModule } from '../agent-certification.module';
import {
  DatabaseCleanup,
  TestDataGenerator,
  TestAssertions,
  IntegrationTestHelpers,
} from '../../../test/utils/test-helpers';

describe('AgentCertification Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: AgentCertificationService;
  let cleanup: DatabaseCleanup;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AgentCertificationModule, AgentTestingModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    service = app.get<AgentCertificationService>(AgentCertificationService);
    cleanup = new DatabaseCleanup(prisma);
  });

  afterAll(async () => {
    await cleanup.cleanAllTestData();
    await app.close();
  });

  afterEach(async () => {
    await cleanup.cleanAllTestData();
  });

  describe('Complete Certification Flow', () => {
    it('should handle full certification lifecycle: test → certify → badge', async () => {
      const agentId = 'agent-cert-flow-1';

      // 1. Get initial certification (should create bronze)
      const initialCert = await service.getCertification(agentId);

      TestAssertions.assertHasFields(initialCert, [
        'certificationId',
        'agentId',
        'level',
        'score',
        'testScore',
        'tasksCompleted',
        'avgRating',
      ]);

      TestAssertions.assertCertificationLevel(initialCert.level);
      expect(initialCert.level).toBe('bronze');

      // 2. Update after test
      const testResult = await service.updateAfterTest(agentId, 85, 85);

      TestAssertions.assertHasFields(testResult, [
        'previousLevel',
        'newLevel',
        'newScore',
        'hasLeveledUp',
      ]);

      TestAssertions.assertScoreRange(testResult.newScore);
      TestAssertions.assertCertificationLevel(testResult.newLevel);

      // 3. Update after tasks
      const taskResult = await service.updateAfterTask(agentId, 5);

      expect(taskResult.newScore).toBeDefined();
      expect(taskResult.newTasksCompleted).toBeDefined();

      // 4. Get final certification
      const finalCert = await service.getCertification(agentId);

      expect(finalCert.level).toBe('silver' || 'gold');
      expect(finalCert.badgeUrl).toContain(finalCert.level);
    });

    it('should maintain certification state across updates', async () => {
      const agentId = 'agent-state-test';

      // Create certification
      const cert1 = await service.getCertification(agentId);
      expect(cert1.level).toBe('bronze');

      // Update with test score
      await service.updateAfterTest(agentId, 90, 90);

      const cert2 = await service.getCertification(agentId);
      expect(cert2.level).toBe('gold');
      expect(cert2.testScore).toBe(90);

      // Update with tasks
      await service.updateAfterTask(agentId, 5, 4.8);

      const cert3 = await service.getCertification(agentId);
      expect(cert3.tasksCompleted).toBe(5);
      expect(cert3.avgRating).toBeCloseTo(4.8, 1);
    });
  });

  describe('Database Persistence', () => {
    it('should persist certification data correctly', async () => {
      const agentId = 'agent-persist-test';

      const serviceCert = await service.getCertification(agentId);

      // Verify in database
      const dbCert = await prisma.agentCertification.findUnique({
        where: { agentId },
      });

      expect(dbCert).toBeDefined();
      expect(dbCert?.agentId).toBe(agentId);
      expect(dbCert?.level).toBe(serviceCert.level);
      expect(dbCert?.score).toBe(serviceCert.score);
    });

    it('should update certification in database', async () => {
      const agentId = 'agent-update-test';

      await service.getCertification(agentId);
      await service.updateAfterTest(agentId, 75, 75);

      const dbCert = await prisma.agentCertification.findUnique({
        where: { agentId },
      });

      expect(dbCert?.testScore).toBe(75);
      expect(dbCert?.level).toBe('silver');
    });

    it('should maintain data integrity across concurrent operations', async () => {
      const agentId = 'agent-concurrent-persist-test';

      await service.getCertification(agentId);

      // Perform concurrent updates
      await Promise.all([
        service.updateAfterTest(agentId, 85, 85),
        service.updateAfterTask(agentId, 5, 4.5),
      ]);

      // Verify final state
      const dbCert = await prisma.agentCertification.findUnique({
        where: { agentId },
      });

      expect(dbCert).toBeDefined();
      expect(dbCert?.testScore).toBeGreaterThan(0);
      expect(dbCert?.tasksCompleted).toBeGreaterThan(0);
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent format for getCertification', async () => {
      const result = await service.getCertification('agent-format-test');

      TestAssertions.assertApiResponse(result, [
        'certificationId',
        'agentId',
        'level',
        'score',
        'testScore',
        'tasksCompleted',
        'avgRating',
        'badgeUrl',
        'earnedAt',
        'expiresAt',
        'isExpired',
      ]);

      TestAssertions.assertScoreRange(result.score);
      TestAssertions.assertCertificationLevel(result.level);
    });

    it('should return consistent format for updateAfterTest', async () => {
      const agentId = 'agent-update-format-test';
      await service.getCertification(agentId);

      const result = await service.updateAfterTest(agentId, 85, 85);

      TestAssertions.assertApiResponse(result, [
        'previousLevel',
        'newLevel',
        'newScore',
        'hasLeveledUp',
        'badgeUrl',
      ]);

      TestAssertions.assertScoreRange(result.newScore);
      TestAssertions.assertCertificationLevel(result.newLevel);
      expect(typeof result.hasLeveledUp).toBe('boolean');
    });

    it('should return consistent format for getLeaderboard', async () => {
      // Create multiple certifications
      for (let i = 1; i <= 5; i++) {
        const agentId = `agent-leaderboard-${i}`;
        await service.getCertification(agentId);
        await service.updateAfterTest(agentId, 50 + i * 10, 50 + i * 10);
      }

      const result = await service.getLeaderboard(undefined, 50, 1);

      TestAssertions.assertPagination(result, {
        page: 1,
        limit: 50,
        total: expect.any(Number),
      });

      expect(result.leaderboard).toBeInstanceOf(Array);
      result.leaderboard.forEach((entry) => {
        TestAssertions.assertApiResponse(entry, [
          'rank',
          'agentId',
          'agentName',
          'level',
          'score',
          'tasksCompleted',
          'avgRating',
        ]);
        TestAssertions.assertScoreRange(entry.score);
        TestAssertions.assertCertificationLevel(entry.level);
      });
    });

    it('should return consistent format for getStats', async () => {
      // Create test data
      for (let i = 1; i <= 3; i++) {
        const agentId = `agent-stats-${i}`;
        await service.getCertification(agentId);
        await service.updateAfterTest(agentId, 60 + i * 15, 60 + i * 15);
      }

      const result = await service.getStats();

      TestAssertions.assertApiResponse(result, [
        'totalCertifications',
        'levelDistribution',
        'averageScore',
        'topPerformers',
      ]);

      expect(result.levelDistribution).toHaveProperty('bronze');
      expect(result.levelDistribution).toHaveProperty('silver');
      expect(result.levelDistribution).toHaveProperty('gold');
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.topPerformers).toBeInstanceOf(Array);
    });
  });

  describe('Multi-Agent Certification', () => {
    it('should handle multiple agents certifying simultaneously', async () => {
      const agents = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'];

      // Create certifications concurrently
      const results = await Promise.all(
        agents.map((agentId) => service.getCertification(agentId)),
      );

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        TestAssertions.assertHasFields(result, [
          'certificationId',
          'agentId',
          'level',
        ]);
        TestAssertions.assertCertificationLevel(result.level);
      });

      // Verify all in database
      const dbCerts = await prisma.agentCertification.findMany({
        where: { agentId: { in: agents } },
      });

      expect(dbCerts).toHaveLength(5);
    });

    it('should handle concurrent certification updates', async () => {
      const agents = Array(10)
        .fill(null)
        .map((_, i) => `agent-concurrent-${i}`);

      // Create certifications
      await Promise.all(agents.map((id) => service.getCertification(id)));

      // Update all concurrently
      const updateResults = await Promise.all(
        agents.map((id) => service.updateAfterTest(id, 75, 75)),
      );

      expect(updateResults).toHaveLength(10);
      updateResults.forEach((result) => {
        TestAssertions.assertScoreRange(result.newScore);
        TestAssertions.assertCertificationLevel(result.newLevel);
      });
    });

    it('should maintain leaderboard accuracy with concurrent updates', async () => {
      const agents = Array(20)
        .fill(null)
        .map((_, i) => `agent-leader-${i}`);

      // Create and update certifications
      await Promise.all(agents.map((id) => service.getCertification(id)));
      await Promise.all(
        agents.map((id, i) =>
          service.updateAfterTest(id, 50 + Math.random() * 50, 50 + Math.random() * 50),
        ),
      );

      const leaderboard = await service.getLeaderboard(undefined, 50, 1);

      expect(leaderboard.leaderboard).toHaveLength(20);
      expect(leaderboard.total).toBe(20);

      // Verify rankings are sequential
      leaderboard.leaderboard.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });

      // Verify scores are in descending order
      for (let i = 1; i < leaderboard.leaderboard.length; i++) {
        expect(leaderboard.leaderboard[i - 1].score).toBeGreaterThanOrEqual(
          leaderboard.leaderboard[i].score,
        );
      }
    });
  });

  describe('Certification Status Synchronization', () => {
    it('should synchronize test results with certification', async () => {
      const agentId = 'agent-sync-test';

      // Initial certification
      await service.getCertification(agentId);

      // Submit high test score
      await service.updateAfterTest(agentId, 95, 95);

      // Verify synchronization
      const cert = await service.getCertification(agentId);
      expect(cert.testScore).toBe(95);
      expect(cert.bestScore).toBe(95);
      expect(cert.level).toBe('gold');
      expect(cert.totalTests).toBe(1);
    });

    it('should synchronize task completion with certification', async () => {
      const agentId = 'agent-task-sync-test';

      await service.getCertification(agentId);

      // Complete multiple tasks
      await service.updateAfterTask(agentId, 5, 4.8);
      await service.updateAfterTask(agentId, 3, 4.9);
      await service.updateAfterTask(agentId, 2, 4.7);

      const cert = await service.getCertification(agentId);
      expect(cert.tasksCompleted).toBe(10);
      expect(cert.avgRating).toBeCloseTo(4.8, 1);
    });

    it('should handle certification expiration correctly', async () => {
      const agentId = 'agent-expiry-test';

      await service.getCertification(agentId);
      await service.updateAfterTest(agentId, 85, 85);

      // Get certification before expiry
      const certBefore = await service.getCertification(agentId);
      expect(certBefore.isExpired).toBe(false);

      // Manually set expiry date to past
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.agentCertification.update({
        where: { agentId },
        data: { expiresAt: pastDate },
      });

      // Get certification after expiry
      const certAfter = await service.getCertification(agentId);
      expect(certAfter.isExpired).toBe(true);

      // Recertify
      await service.updateAfterTest(agentId, 90, 90);

      const certRenewed = await service.getCertification(agentId);
      expect(certRenewed.isExpired).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should handle bulk certification operations efficiently', async () => {
      const agentCount = 100;
      const agents = Array(agentCount)
        .fill(null)
        .map((_, i) => `agent-bulk-${i}`);

      const { timeMs } = await IntegrationTestHelpers.measureTime(async () => {
        await Promise.all(agents.map((id) => service.getCertification(id)));
      });

      // Should complete within reasonable time
      expect(timeMs).toBeLessThan(10000); // 10 seconds
    });

    it('should handle leaderboard queries efficiently with large datasets', async () => {
      // Create 500 certifications
      const agents = Array(500)
        .fill(null)
        .map((_, i) => `agent-perf-${i}`);

      await Promise.all(
        agents.map((id) => service.getCertification(id)),
      );
      await Promise.all(
        agents.map((id) =>
          service.updateAfterTest(id, Math.random() * 100, Math.random() * 100),
        ),
      );

      const { timeMs } = await IntegrationTestHelpers.measureTime(async () => {
        await service.getLeaderboard(undefined, 100, 1);
      });

      expect(timeMs).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle non-existent certification gracefully', async () => {
      await expect(
        service.updateAfterTest('non-existent-agent', 85, 85),
      ).rejects.toThrow();
    });

    it('should handle invalid level assignments', async () => {
      const agentId = 'agent-invalid-level';
      await service.getCertification(agentId);

      await expect(
        service.setLevel(agentId, 'platinum' as any),
      ).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      const agentId = 'agent-db-error';

      // Create certification
      await service.getCertification(agentId);

      // Simulate database error by trying to update with invalid data
      // (This will be caught by validation)
      await expect(
        service.setLevel(agentId, 'invalid' as any),
      ).rejects.toThrow();
    });
  });
});
