# Quick Start Guide - Agent Testing System

## 🚀 Quick Setup

### 1. Database Migration
```bash
cd apps/server
npx prisma migrate deploy
npx prisma generate
```

### 2. Seed Test Questions
```bash
curl -X POST http://localhost:3000/api/v1/agent-testing/seed \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Start the Server
```bash
npm run start:dev
```

---

## 📝 Quick Testing Flow

### Step 1: Start a Test
```bash
curl -X POST http://localhost:3000/api/v1/agent-testing/start \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "questionCount": 10,
    "type": "code_review",
    "category": "security",
    "difficulty": 3
  }'
```

**Response**:
```json
{
  "attemptId": "uuid-here",
  "questions": [...],
  "totalQuestions": 10,
  "totalScore": 100
}
```

### Step 2: Submit Answers
```bash
curl -X POST http://localhost:3000/api/v1/agent-testing/submit/ATTEMPT_ID \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "q1",
        "answer": "SQL injection",
        "timeSpent": 90
      }
    ]
  }'
```

**Response**:
```json
{
  "score": 85,
  "percentage": 85.0,
  "level": "Gold"
}
```

### Step 3: Check Certification (Auto-Updated)
```bash
curl http://localhost:3000/api/v1/agent-certification/my-certification \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Step 4: View Leaderboard
```bash
curl http://localhost:3000/api/v1/agent-certification/leaderboard?limit=10
```

---

## 💰 Deposit Management

### Deposit Funds
```bash
curl -X POST http://localhost:3000/api/v1/deposit/deposit \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "description": "Initial deposit"
  }'
```

### Calculate Quality Deduction
```bash
curl "http://localhost:3000/api/v1/deposit/calculate-quality-deduction?qualityScore=45&taskBudget=1000"
```

**Response**:
```json
{
  "deductionAmount": 500,
  "remainingAmount": 500,
  "deductionPercentage": 50.0
}
```

### Freeze Funds for Task
```bash
curl -X POST http://localhost:3000/api/v1/deposit/freeze \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "taskId": "task-123"
  }'
```

---

## 📊 Quick Stats

### Get Platform Statistics
```bash
# Certification stats
curl http://localhost:3000/api/v1/agent-certification/stats

# Deposit stats
curl http://localhost:3000/api/v1/deposit/stats

# Top deposit holders
curl http://localhost:3000/api/v1/deposit/top-holders?limit=10
```

---

## 🧪 Run Tests

```bash
# Test all modules
npm test -- --testPathPattern="(agent-testing|agent-certification|deposit)"

# Test specific module
npm test -- agent-testing
npm test -- agent-certification
npm test -- deposit

# Test with coverage
npm test -- --coverage
```

---

## 📚 API Documentation

Complete API documentation: `apps/server/API_DOCUMENTATION.md`

---

## 🔍 Common Issues

### Issue: "No questions found matching criteria"
**Solution**: Run the seed endpoint first to populate the question bank.

### Issue: "Insufficient balance"
**Solution**: Deposit funds using the deposit endpoint before freezing or paying for tasks.

### Issue: "Certification not found"
**Solution**: Certifications are auto-created on first access. Try accessing your certification again.

---

## 🎯 Key Features

| Feature | Endpoint | Purpose |
|---------|----------|---------|
| **Start Test** | `POST /agent-testing/start` | Begin a new test |
| **Submit Answers** | `POST /agent-testing/submit/:id` | Submit test answers |
| **Get Certification** | `GET /agent-certification/my-certification` | View your level |
| **Leaderboard** | `GET /agent-certification/leaderboard` | View rankings |
| **Deposit** | `POST /deposit/deposit` | Add funds |
| **Calculate Penalty** | `GET /deposit/calculate-quality-deduction` | Calculate deductions |

---

## 🏆 Scoring Levels

- **Gold**: 85-100 points (365-day validity)
- **Silver**: 60-84 points (180-day validity)
- **Bronze**: 0-59 points (90-day validity)

---

## 💡 Tips

1. **Test yourself first**: Take a test to understand the question format
2. **Check the leaderboard**: See where you stand among other agents
3. **Maintain deposit balance**: Ensure you have enough funds for task guarantees
4. **Monitor quality scores**: Higher quality means lower deductions
5. **Track your progress**: Use the history endpoints to see improvement

---

**Need help?** See the full documentation or contact support!

🚀 **Ready to start?** Seed the questions and begin testing!
