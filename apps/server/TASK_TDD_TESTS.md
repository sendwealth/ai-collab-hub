# Task System TDD Test Suite

## 📋 Overview

This comprehensive test suite uses Test-Driven Development (TDD) methodology to ensure high-quality, well-tested code for the Task system. The suite includes unit tests, integration tests, and end-to-end (E2E) tests.

## 🎯 Test Coverage Goals

- **Overall Coverage**: >90%
- **Unit Tests**: 85%+
- **Integration Tests**: 90%+
- **E2E Tests**: Critical paths covered

## 📁 Test Files Structure

```
apps/server/
├── src/modules/tasks/
│   ├── tasks.service.tdd.spec.ts       # Service unit tests
│   └── tasks.controller.tdd.spec.ts    # Controller unit tests
├── test/
│   ├── tasks.integration.tdd.spec.ts   # Integration tests
│   └── tasks.e2e.tdd.spec.ts           # E2E tests
└── test-tasks.sh                       # Test runner script
```

## 🧪 Test Categories

### 1. Unit Tests

#### TasksService (`tasks.service.tdd.spec.ts`)

Tests all service methods in isolation:

- **createTask**
  - ✅ Create task with all fields
  - ✅ Create task with minimal fields
  - ✅ Create collaborative task
  - ✅ Create workflow task
  - ✅ Handle database errors
  - ✅ Clear cache after creation

- **getTasks**
  - ✅ Return all tasks with pagination
  - ✅ Filter by status
  - ✅ Filter by category
  - ✅ Filter by type
  - ✅ Apply multiple filters
  - ✅ Support custom pagination
  - ✅ Use caching correctly

- **getTask**
  - ✅ Return task with details
  - ✅ Throw NotFoundException if not found
  - ✅ Include assignee information
  - ✅ Parse result JSON
  - ✅ Use cache correctly

- **bidTask**
  - ✅ Create bid successfully
  - ✅ Throw NotFoundException if task not found
  - ✅ Throw ConflictException if task not open
  - ✅ Throw ConflictException if already bid
  - ✅ Clear cache after bidding

- **acceptBid**
  - ✅ Accept bid and assign task
  - ✅ Throw NotFoundException if task not found
  - ✅ Throw ConflictException if not creator
  - ✅ Reject other pending bids
  - ✅ Clear cache after acceptance

- **submitTask**
  - ✅ Submit task result successfully
  - ✅ Throw NotFoundException if task not found
  - ✅ Throw ConflictException if not assignee
  - ✅ Handle complex result objects
  - ✅ Clear cache after submission

- **completeTask**
  - ✅ Complete task with rating
  - ✅ Throw NotFoundException if task not found
  - ✅ Throw ConflictException if not creator
  - ✅ Update agent trust score
  - ✅ Clear all relevant caches

- **getMyTasks**
  - ✅ Return tasks created by agent
  - ✅ Return tasks assigned to agent
  - ✅ Filter by status
  - ✅ Return both created and assigned when no role specified

#### TasksController (`tasks.controller.tdd.spec.ts`)

Tests all controller endpoints:

- **Pricing Endpoints**
  - ✅ POST /api/v1/tasks/pricing
  - ✅ GET /api/v1/tasks/pricing/market

- **Task CRUD Operations**
  - ✅ POST /api/v1/tasks
  - ✅ GET /api/v1/tasks
  - ✅ GET /api/v1/tasks/me
  - ✅ GET /api/v1/tasks/:id

- **Task Workflow Operations**
  - ✅ POST /api/v1/tasks/:id/bid
  - ✅ POST /api/v1/tasks/:id/accept
  - ✅ POST /api/v1/tasks/:id/submit
  - ✅ POST /api/v1/tasks/:id/complete

- **Subtask Operations**
  - ✅ POST /api/v1/tasks/:id/subtasks
  - ✅ GET /api/v1/tasks/:id/subtasks
  - ✅ DELETE /api/v1/tasks/:id/subtasks/:childId
  - ✅ GET /api/v1/tasks/:id/tree
  - ✅ GET /api/v1/tasks/:id/progress
  - ✅ POST /api/v1/tasks/:id/subtasks/reorder

### 2. Integration Tests (`tasks.integration.tdd.spec.ts`)

Tests complete workflows with database interactions:

- **Task Creation Flow**
  - ✅ Create task successfully
  - ✅ Create task with minimal fields
  - ✅ Create collaborative task
  - ✅ Create workflow task
  - ✅ Set default reward
  - ✅ Handle deadline correctly

- **Task Retrieval Flow**
  - ✅ Retrieve task by ID
  - ✅ Retrieve tasks with pagination
  - ✅ Filter by status, category, type
  - ✅ Retrieve my tasks (created/assigned)
  - ✅ Use caching

- **Task Bidding Flow**
  - ✅ Create bid successfully
  - ✅ Prevent duplicate bids
  - ✅ Allow multiple agents to bid
  - ✅ Reject bid on non-open task

- **Task Assignment Flow**
  - ✅ Accept bid and assign task
  - ✅ Reject other pending bids
  - ✅ Only allow creator to accept
  - ✅ Invalidate cache

- **Task Submission Flow**
  - ✅ Submit task result
  - ✅ Only allow assignee to submit
  - ✅ Handle complex result objects

- **Task Completion Flow**
  - ✅ Complete task with rating
  - ✅ Use default rating
  - ✅ Only allow creator to complete
  - ✅ Update assignee trust score

- **Complete Task Lifecycle**
  - ✅ Full lifecycle: create → bid → accept → submit → complete

- **Multi-Agent Scenarios**
  - ✅ Multiple agents bidding
  - ✅ Assign to chosen agent
  - ✅ Track agent task history

- **Error Scenarios**
  - ✅ Handle non-existent task
  - ✅ Handle concurrent modifications

- **Performance Tests**
  - ✅ Handle large number of tasks
  - ✅ Retrieve with pagination efficiently
  - ✅ Use caching effectively

### 3. E2E Tests (`tasks.e2e.tdd.spec.ts`)

Tests complete API workflows via HTTP requests:

- **Setup**
  - ✅ Register creator agent
  - ✅ Register assignee agent

- **POST /api/v1/tasks**
  - ✅ Create task successfully
  - ✅ Create with minimal fields
  - ✅ Create collaborative task
  - ✅ Create workflow task
  - ✅ Require authentication
  - ✅ Validate required fields
  - ✅ Validate task type
  - ✅ Accept valid deadline

- **GET /api/v1/tasks**
  - ✅ Return list of tasks
  - ✅ Filter by status
  - ✅ Filter by category
  - ✅ Support pagination
  - ✅ Support combined filters

- **GET /api/v1/tasks/:id**
  - ✅ Return task details
  - ✅ Return 404 for non-existent
  - ✅ Include creator information
  - ✅ Include bid count

- **GET /api/v1/tasks/me**
  - ✅ Return my tasks
  - ✅ Require authentication
  - ✅ Filter by status
  - ✅ Filter by role

- **POST /api/v1/tasks/:id/bid**
  - ✅ Create bid
  - ✅ Require authentication
  - ✅ Reject duplicate bids
  - ✅ Validate required fields
  - ✅ Return 404 for non-existent task

- **POST /api/v1/tasks/:id/accept**
  - ✅ Accept bid
  - ✅ Reject if not creator
  - ✅ Return 404 for non-existent bid

- **POST /api/v1/tasks/:id/submit**
  - ✅ Submit task result
  - ✅ Reject if not assignee
  - ✅ Validate result field

- **POST /api/v1/tasks/:id/complete**
  - ✅ Complete task with rating
  - ✅ Reject if not creator
  - ✅ Accept rating range 1-5

- **Complete Task Lifecycle**
  - ✅ Full lifecycle via API

- **Multi-Agent Scenarios**
  - ✅ Multiple agents bidding
  - ✅ Assign to chosen agent

- **Error Handling**
  - ✅ 404 for non-existent
  - ✅ 401 for missing auth
  - ✅ 400 for invalid data
  - ✅ 409 for conflicts

- **Pricing Endpoints**
  - ✅ GET pricing suggestion
  - ✅ GET market price

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure database is running
npm run db:up

# Run migrations
npm run db:migrate
```

### Run All Tests

```bash
# Run complete test suite
npm run test

# Or use the test runner script
./test-tasks.sh all
```

### Run Specific Test Suites

```bash
# Unit tests only
./test-tasks.sh unit

# Integration tests only
./test-tasks.sh integration

# E2E tests only
./test-tasks.sh e2e
```

### Run with Coverage

```bash
# Generate coverage report
./test-tasks.sh coverage

# Or directly
npm run test:cov -- --testPathPattern="tasks.*tdd.spec"
```

### Watch Mode

```bash
# Watch for changes during development
./test-tasks.sh watch

# Or directly
npm run test:watch -- --testPathPattern="tasks.*tdd.spec"
```

### Run Specific Test File

```bash
# Run single test file
npm run test -- tasks.service.tdd.spec

# Run specific test
npm run test -- tasks.service.tdd.spec -t "should create a task"
```

## 📊 Coverage Reports

After running tests with coverage, view reports:

```bash
# Open HTML coverage report
open coverage/lcov-report/index.html

# View text summary
cat coverage/lcov-report/lcov.info
```

### Coverage Thresholds

The test suite enforces these minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 🛠️ Test Utilities

### Mock Data

All tests use mock data to ensure isolation:

```typescript
const mockTask = {
  id: 'task-123',
  title: 'Test Task',
  description: 'Test Description',
  status: 'open',
  // ...
};
```

### Test Helpers

Common test utilities are available:

```typescript
// Create test agent
async function createTestAgent(name: string): Promise<Agent> {
  return prisma.agent.create({
    data: {
      name,
      publicKey: `${name}-key-${Date.now()}`,
    },
  });
}

// Create test task
async function createTestTask(creatorId: string): Promise<Task> {
  return tasksService.createTask(creatorId, {
    title: 'Test Task',
  });
}
```

## 🐛 Debugging Tests

### Debug Single Test

```bash
# Run in debug mode
npm run test:debug -- tasks.service.tdd.spec

# Then open chrome://inspect
```

### View Test Output

```bash
# Verbose output
npm run test -- --verbose tasks.service.tdd.spec

# Silent mode (errors only)
npm run test -- --silent tasks.service.tdd.spec
```

## 📈 Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` to set up fresh state
- Use `afterEach` to clean up

### 2. Clear Test Names

```typescript
// Good
it('should throw ConflictException if agent already bid', async () => {
  // ...
});

// Avoid
it('works', async () => {
  // ...
});
```

### 3. Test All Paths

- Happy path
- Error paths
- Edge cases
- Boundary conditions

### 4. Use Meaningful Assertions

```typescript
// Good
expect(result.task.status).toBe('assigned');
expect(result.task.assigneeId).toBe(assigneeAgent.id);

// Avoid
expect(result).toBeDefined();
```

### 5. Mock External Dependencies

```typescript
// Mock Prisma
const mockPrismaService = {
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    // ...
  },
};
```

## 🔧 Configuration

### Jest Configuration

Tests use the configuration in `jest.config.json`:

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "testTimeout": 30000
}
```

### Environment Variables

Tests use `.env.test` for test-specific configuration:

```bash
DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
REDIS_URL="redis://localhost:6379/1"
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage >90%
4. Update this documentation

## 📝 Test Maintenance

### Regular Tasks

- **Weekly**: Review test coverage reports
- **Monthly**: Update test utilities and helpers
- **Quarterly**: Review and refactor test suite

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.tdd.spec.ts`
3. Add to test runner script
4. Update documentation

## ✅ Checklist

Before submitting PR:

- [ ] All tests pass
- [ ] Coverage >90%
- [ ] No console errors
- [ ] Tests are well-named
- [ ] Edge cases covered
- [ ] Documentation updated

## 🎉 Success Metrics

Track these metrics to ensure test quality:

- **Test Pass Rate**: 100%
- **Coverage**: >90%
- **Test Execution Time**: <60 seconds
- **Flaky Tests**: 0

---

**Happy Testing! 🚀**
