# Credits System TDD Test Suite - Documentation

## Overview

This directory contains a comprehensive Test-Driven Development (TDD) test suite for the Credits System, covering all aspects from unit tests to integration tests.

## Test Files

### 1. Unit Tests

#### `credits.service.spec.ts`
- **Purpose**: Test all CreditsService methods
- **Coverage**:
  - `getBalance()` - Balance queries
  - `deposit()` - Credit deposits
  - `withdraw()` - Credit withdrawals
  - `transfer()` - Inter-agent transfers
  - `freeze()` - Freeze credits
  - `unfreeze()` - Unfreeze credits
  - `getTransactionHistory()` - Transaction history queries
  - `rewardAgent()` - Task reward system

#### `credits.controller.spec.ts`
- **Purpose**: Test all CreditsController endpoints
- **Coverage**:
  - `GET /credits/balance` - Get balance
  - `POST /credits/deposit` - Deposit credits
  - `POST /credits/withdraw` - Withdraw credits
  - `POST /credits/transfer` - Transfer credits
  - `POST /credits/freeze` - Freeze credits
  - `POST /credits/unfreeze` - Unfreeze credits
  - `GET /credits/transactions` - Get transaction history

### 2. Integration Tests

#### `credits.integration.spec.ts`
- **Purpose**: End-to-end testing of complete workflows
- **Scenarios**:
  - Complete deposit → transfer → withdraw flow
  - Freeze/unfreeze operations
  - Transaction history with pagination
  - Multi-agent transfers
  - Concurrent operations

### 3. Boundary Tests

#### `credits.boundary.spec.ts`
- **Purpose**: Test edge cases and boundary conditions
- **Coverage**:
  - Negative amount handling
  - Zero amount operations
  - Maximum value handling (Number.MAX_SAFE_INTEGER)
  - Balance edge cases (exact balance, frozen balance)
  - Invalid inputs (non-existent agents, transfer to self)
  - Decimal/floating point handling
  - Pagination edge cases
  - Date range edge cases

### 4. Concurrency Tests

#### `credits.concurrent.spec.ts`
- **Purpose**: Test concurrent operations and race conditions
- **Scenarios**:
  - Concurrent withdrawals
  - Concurrent transfers
  - Concurrent deposits
  - Mixed concurrent operations
  - Concurrent freeze/unfreeze
  - Race condition scenarios

## Test Utilities

### `utils/credits-test.utils.ts`

Provides helper classes and factories:

#### `CreditsMockFactory`
- `createCredit()` - Create mock credit accounts
- `createTransaction()` - Create mock transactions
- `createDepositTransaction()` - Create deposit transactions
- `createWithdrawTransaction()` - Create withdrawal transactions
- `createTransferTransaction()` - Create transfer transactions
- `createFreezeTransaction()` - Create freeze transactions
- `createUnfreezeTransaction()` - Create unfreeze transactions
- `createEarnTransaction()` - Create earn transactions

#### `CreditsTestScenarios`
- `createMultiAgentScenario()` - Multi-agent test scenario
- `createFrozenBalanceScenario()` - Frozen balance scenario
- `createLowBalanceScenario()` - Low balance scenario

#### `CreditsAssertions`
- `assertBalance()` - Assert balance values
- `assertTransaction()` - Assert transaction properties
- `assertPagination()` - Assert pagination results

## Running Tests

### Run All Credits Tests
```bash
npm test -- credits
```

### Run Specific Test File
```bash
npm test -- credits.service.spec.ts
npm test -- credits.controller.spec.ts
npm test -- credits.integration.spec.ts
npm test -- credits.boundary.spec.ts
npm test -- credits.concurrent.spec.ts
```

### Run with Coverage
```bash
npm run test:cov -- credits
```

### Run Integration Tests Only
```bash
npm run test:e2e -- credits.integration
```

## Coverage Target

**Minimum Coverage: 90%**

The test suite is designed to achieve >90% code coverage across:
- Lines
- Functions
- Branches
- Statements

## Test Categories

### 1. Positive Tests
- Valid operations with correct inputs
- Expected successful outcomes
- Normal use cases

### 2. Negative Tests
- Invalid inputs (negative amounts, non-existent agents)
- Insufficient balance scenarios
- Invalid operations (transfer to self)

### 3. Edge Cases
- Zero amounts
- Maximum values
- Frozen balance scenarios
- Empty results

### 4. Concurrency Tests
- Simultaneous operations
- Race conditions
- Transaction isolation

## Mocking Strategy

### PrismaService Mock
All database operations are mocked using a consistent mock structure:

```typescript
const mockPrismaService = {
  credit: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  creditTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(mockPrismaService)),
};
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Clear Names**: Test names clearly describe what's being tested
3. **Arrange-Act-Assert**: Tests follow AAA pattern
4. **Mock Reset**: Mocks are cleared after each test
5. **Coverage Focus**: Tests aim for maximum code coverage
6. **Edge Cases**: Boundary conditions are thoroughly tested

## Test Data

Test data is generated using factory functions to ensure:
- Consistency across tests
- Easy modification of test data
- Clear intent in test scenarios

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies
- Fast execution
- Clear pass/fail indicators
- Coverage reporting

## Troubleshooting

### Common Issues

1. **Mock not called**: Ensure mock is reset in `afterEach()`
2. **Transaction not working**: Check `$transaction` mock implementation
3. **Async issues**: Use `async/await` properly
4. **Coverage low**: Check for untested branches

### Debug Mode
```bash
npm run test:debug -- credits.service.spec.ts
```

## Future Improvements

1. Add performance tests for large-scale operations
2. Add stress tests for high concurrency
3. Add mutation testing
4. Add visual coverage reports
5. Add test execution time tracking

## Maintenance

- Update tests when adding new features
- Maintain coverage above 90%
- Refactor tests when refactoring code
- Add new test categories as needed
