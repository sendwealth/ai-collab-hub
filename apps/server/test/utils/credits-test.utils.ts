import { Credit, CreditTransaction } from '@prisma/client';

/**
 * Mock data factories for Credits testing
 */
export class CreditsMockFactory {
  /**
   * Create a mock credit account
   */
  static createCredit(overrides: Partial<Credit> = {}): Credit {
    return {
      id: 'credit-1',
      agentId: 'agent-1',
      balance: 1000,
      frozenBalance: 0,
      totalEarned: 1000,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create a mock credit transaction
   */
  static createTransaction(
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction {
    return {
      id: 'tx-1',
      agentId: 'agent-1',
      type: 'deposit',
      amount: 100,
      balance: 100,
      description: 'Test transaction',
      metadata: null,
      taskId: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create multiple mock transactions
   */
  static createTransactions(
    count: number,
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction[] {
    return Array(count)
      .fill(null)
      .map((_, i) =>
        this.createTransaction({
          id: `tx-${i + 1}`,
          ...overrides,
        }),
      );
  }

  /**
   * Create a deposit transaction
   */
  static createDepositTransaction(
    amount: number,
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction {
    return this.createTransaction({
      type: 'deposit',
      amount,
      description: 'Deposit',
      ...overrides,
    });
  }

  /**
   * Create a withdraw transaction
   */
  static createWithdrawTransaction(
    amount: number,
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction {
    return this.createTransaction({
      type: 'withdraw',
      amount: -amount,
      description: 'Withdraw',
      ...overrides,
    });
  }

  /**
   * Create a transfer transaction
   */
  static createTransferTransaction(
    amount: number,
    direction: 'in' | 'out',
    otherAgentId: string,
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction {
    return this.createTransaction({
      type: 'transfer',
      amount: direction === 'in' ? amount : -amount,
      description:
        direction === 'in'
          ? `Transfer from ${otherAgentId}`
          : `Transfer to ${otherAgentId}`,
      metadata: JSON.stringify({
        [direction === 'in' ? 'fromAgentId' : 'toAgentId']: otherAgentId,
      }),
      ...overrides,
    });
  }

  /**
   * Create a freeze transaction
   */
  static createFreezeTransaction(
    amount: number,
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction {
    return this.createTransaction({
      type: 'freeze',
      amount: -amount,
      description: 'Freeze credits',
      metadata: JSON.stringify({ frozenAmount: amount }),
      ...overrides,
    });
  }

  /**
   * Create an unfreeze transaction
   */
  static createUnfreezeTransaction(
    amount: number,
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction {
    return this.createTransaction({
      type: 'unfreeze',
      amount,
      description: 'Unfreeze credits',
      metadata: JSON.stringify({ unfrozenAmount: amount }),
      ...overrides,
    });
  }

  /**
   * Create an earn transaction
   */
  static createEarnTransaction(
    amount: number,
    taskId: string,
    overrides: Partial<CreditTransaction> = {},
  ): CreditTransaction {
    return this.createTransaction({
      type: 'earn',
      amount,
      description: 'Task reward',
      taskId,
      ...overrides,
    });
  }
}

/**
 * Test scenarios for credits testing
 */
export class CreditsTestScenarios {
  /**
   * Create a scenario with multiple agents and transactions
   */
  static createMultiAgentScenario() {
    const agents = [
      { id: 'agent-1', name: 'Alice', balance: 1000 },
      { id: 'agent-2', name: 'Bob', balance: 500 },
      { id: 'agent-3', name: 'Charlie', balance: 750 },
    ];

    const credits = agents.map((agent) =>
      CreditsMockFactory.createCredit({
        agentId: agent.id,
        balance: agent.balance,
        totalEarned: agent.balance,
      }),
    );

    const transactions = [
      CreditsMockFactory.createDepositTransaction(1000, { agentId: 'agent-1' }),
      CreditsMockFactory.createTransferTransaction(200, 'out', 'agent-2', {
        agentId: 'agent-1',
      }),
      CreditsMockFactory.createTransferTransaction(200, 'in', 'agent-1', {
        agentId: 'agent-2',
      }),
    ];

    return { agents, credits, transactions };
  }

  /**
   * Create a frozen balance scenario
   */
  static createFrozenBalanceScenario() {
    const credit = CreditsMockFactory.createCredit({
      balance: 1000,
      frozenBalance: 300,
    });

    const transactions = [
      CreditsMockFactory.createDepositTransaction(1000),
      CreditsMockFactory.createFreezeTransaction(300),
    ];

    return { credit, transactions };
  }

  /**
   * Create a low balance scenario
   */
  static createLowBalanceScenario() {
    const credit = CreditsMockFactory.createCredit({
      balance: 10,
      frozenBalance: 0,
    });

    const transactions = [
      CreditsMockFactory.createDepositTransaction(100),
      CreditsMockFactory.createWithdrawTransaction(90),
    ];

    return { credit, transactions };
  }
}

/**
 * Assertion helpers for credits testing
 */
export class CreditsAssertions {
  /**
   * Assert that a balance object has expected values
   */
  static assertBalance(
    result: any,
    expected: {
      balance?: number;
      frozenBalance?: number;
      availableBalance?: number;
      totalEarned?: number;
      totalSpent?: number;
    },
  ) {
    if (expected.balance !== undefined) {
      expect(result.balance).toBe(expected.balance);
    }
    if (expected.frozenBalance !== undefined) {
      expect(result.frozenBalance).toBe(expected.frozenBalance);
    }
    if (expected.availableBalance !== undefined) {
      expect(result.availableBalance).toBe(expected.availableBalance);
    }
    if (expected.totalEarned !== undefined) {
      expect(result.totalEarned).toBe(expected.totalEarned);
    }
    if (expected.totalSpent !== undefined) {
      expect(result.totalSpent).toBe(expected.totalSpent);
    }
  }

  /**
   * Assert that a transaction has expected properties
   */
  static assertTransaction(
    transaction: any,
    expected: {
      type?: string;
      amount?: number;
      balance?: number;
      agentId?: string;
    },
  ) {
    if (expected.type !== undefined) {
      expect(transaction.type).toBe(expected.type);
    }
    if (expected.amount !== undefined) {
      expect(transaction.amount).toBe(expected.amount);
    }
    if (expected.balance !== undefined) {
      expect(transaction.balance).toBe(expected.balance);
    }
    if (expected.agentId !== undefined) {
      expect(transaction.agentId).toBe(expected.agentId);
    }
  }

  /**
   * Assert that pagination result is valid
   */
  static assertPagination(
    result: any,
    expected: {
      page: number;
      limit: number;
      total: number;
      totalPages?: number;
    },
  ) {
    expect(result.page).toBe(expected.page);
    expect(result.limit).toBe(expected.limit);
    expect(result.total).toBe(expected.total);
    if (expected.totalPages !== undefined) {
      expect(result.totalPages).toBe(expected.totalPages);
    }
    expect(result.transactions).toBeInstanceOf(Array);
    expect(result.transactions.length).toBeLessThanOrEqual(expected.limit);
  }
}
