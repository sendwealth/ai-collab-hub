# API Endpoint Mapping Issues and Solutions

## Current Issues

### 1. Port Mismatch
- **Frontend expects:** `http://localhost:3007`
- **Backend configured:** `http://localhost:3000`

**Solution:** Change `apps/server/.env`:
```env
PORT=3007
```

### 2. API Endpoint Mismatches

#### Agent Testing Module
**Frontend calls:**
- POST `/api/v1/agent-testing/start`
- POST `/api/v1/agent-testing/submit`

**Backend actual endpoints:**
- POST `/api/v1/agent-testing/start` ✅ (matches)
- POST `/api/v1/agent-testing/submit/:attemptId` ❌ (requires attemptId in URL)

**Issue:** Frontend needs to extract `attemptId` from start response and include it in submit URL.

**Backend Controller:** `apps/server/src/modules/agent-testing/agent-testing.controller.ts`
```typescript
@Post('submit/:attemptId')
async submitAnswers(
  @Agent('id') agentId: string,
  @Param('attemptId') attemptId: string,
  @Body() submitAnswersDto: SubmitAnswersDto,
)
```

**Frontend fix needed:**
```typescript
// Store attemptId from start response
const { sessionId } = await response.json(); // This is the attemptId

// Submit with attemptId in URL
await fetch(`http://localhost:3007/api/v1/agent-testing/submit/${sessionId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ answers: answersArray }),
});
```

#### Agent Certification Module
**Frontend calls:**
- GET `/api/v1/agent-certification/status`
- POST `/api/v1/agent-certification/apply`

**Backend actual endpoints:**
- GET `/api/v1/agent-certification/my-certification` ❌
- No apply endpoint exists ❌

**Issue:** Endpoints don't match at all. Backend uses `my-certification` not `status`.

**Backend Controller:** `apps/server/src/modules/agent-certification/agent-certification.controller.ts`
```typescript
@Get('my-certification')
async getMyCertification(@Agent('id') agentId: string)

@Post('admin/set-level/:agentId')  // Admin endpoint, not for application
async setLevel(@Param('agentId') agentId: string, @Body() body: { level: string })
```

**Missing:** There's no public "apply for certification" endpoint in the backend.

**Frontend fix needed:**
```typescript
// Change status endpoint
const response = await fetch('http://localhost:3007/api/v1/agent-certification/my-certification');

// Note: Apply functionality doesn't exist in backend yet
// Would need to be implemented in AgentCertificationService
```

#### Deposit Module
**Frontend calls:**
- GET `/api/v1/deposit/balance` ✅
- GET `/api/v1/deposit/transactions` ✅
- POST `/api/v1/deposit/deposit` ✅
- POST `/api/v1/deposit/withdraw` ❌

**Backend actual endpoints:**
- GET `/api/v1/deposit/balance` ✅
- GET `/api/v1/deposit/transactions` ✅
- POST `/api/v1/deposit/deposit` ✅
- No withdraw endpoint exists ❌

**Issue:** Backend doesn't have a withdraw endpoint, only deposit, deduct, refund, freeze, unfreeze.

**Backend Controller:** `apps/server/src/modules/deposit/deposit.controller.ts`
```typescript
@Post('deposit')
async deposit(@Agent('id') agentId: string, @Body() depositDto: DepositDto)

@Post('deduct')  // For penalties
async deduct(@Agent('id') agentId: string, @Body() deductDto: DeductDto)

@Post('refund')  // For refunds
async refund(@Agent('id') agentId: string, @Body() refundDto: RefundDto)

// NO withdraw endpoint exists
```

**Frontend fix needed:**
Either:
1. Add withdraw endpoint to backend controller, OR
2. Use a combination of unfreeze + deduct for withdrawals

### 3. Authentication Requirement

**All backend endpoints use:**
```typescript
@UseGuards(AgentAuthGuard)
```

**This requires:**
- JWT token in Authorization header
- Valid agent session

**Frontend is missing:**
- No authentication implementation
- No token storage/retrieval
- No login/logout functionality

**Required headers:**
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,  // Missing!
}
```

## Required Fixes

### Priority 1: Backend Configuration
1. Update `apps/server/.env`: Set `PORT=3007`
2. Or update all frontend API calls to use port 3000

### Priority 2: Backend Endpoints
Add missing endpoints to controllers:

**AgentCertificationController** - Add:
```typescript
@Get('status')
async getStatus(@Agent('id') agentId: string) {
  return this.agentCertificationService.getCertification(agentId);
}

@Post('apply')
async applyForCertification(@Agent('id') agentId: string) {
  return this.agentCertificationService.apply(agentId);
}
```

**DepositController** - Add:
```typescript
@Post('withdraw')
async withdraw(@Agent('id') agentId: string, @Body() withdrawDto: DepositDto) {
  return this.depositService.withdraw(agentId, withdrawDto.amount, withdrawDto.description);
}
```

### Priority 3: Frontend Authentication
Add authentication to all API calls:

```typescript
// Utility function to get token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Use in fetch calls
const response = await fetch('http://localhost:3007/api/v1/agent-testing/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
});
```

### Priority 4: Fix Endpoint Calls
Update frontend to match backend URLs:

**testing/page.tsx:**
```typescript
// Submit with attemptId in URL parameter
await fetch(`http://localhost:3007/api/v1/agent-testing/submit/${sessionId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
  body: JSON.stringify({
    answers: answersArray,
  }),
});
```

**certification/page.tsx:**
```typescript
// Change endpoint name
const response = await fetch('http://localhost:3007/api/v1/agent-certification/my-certification', {
  headers: {
    'Authorization': `Bearer ${getAuthToken()}`,
  },
});
```

## Testing Without Authentication

For development/testing purposes, you can temporarily disable authentication:

**Option 1: Remove guards from controllers**
Edit each controller and comment out `@UseGuards(AgentAuthGuard)`:

```typescript
@Controller('agent-testing')
// @UseGuards(AgentAuthGuard)  // Comment out for testing
export class AgentTestingController {
```

**Option 2: Add a dev-only public endpoint**
```typescript
@Post('public/start')
async startTestPublic(@Body() startTestDto: StartTestDto) {
  // Use a dummy agent ID for testing
  return this.agentTestingService.startTest('test-agent-id', startTestDto);
}
```

## Summary

- ✅ All 3 pages created with full UI
- ❌ Backend endpoints need alignment
- ❌ Authentication not implemented in frontend
- ❌ Port configuration mismatch

**Recommended Next Steps:**
1. Decide on port (3000 or 3007) and update accordingly
2. Either implement auth in frontend or disable guards for testing
3. Add missing backend endpoints (withdraw, apply)
4. Update frontend API calls to match backend URLs
5. Test end-to-end functionality
