import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StartTestDto, SubmitAnswersDto, AnswerDto } from './dto';
import { randomInt } from 'crypto';

@Injectable()
export class AgentTestingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a new test attempt for an agent
   */
  async startTest(agentId: string, startTestDto: StartTestDto) {
    const { questionCount = 10, type = 'all', category = 'all', difficulty } = startTestDto;

    // Build query filters
    const where: any = {};
    if (type !== 'all') {
      where.type = type;
    }
    if (category !== 'all') {
      where.category = category;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get available questions
    const questions = await this.prisma.agentTestQuestion.findMany({
      where,
      take: questionCount * 2, // Get more than needed for randomization
    });

    if (questions.length === 0) {
      throw new NotFoundException('No questions found matching the criteria');
    }

    // Randomly select questions
    const selectedQuestions = this.getRandomItems(questions, Math.min(questionCount, questions.length));

    // Calculate total score
    const totalScore = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

    // Create test attempt
    const attempt = await this.prisma.agentTestAttempt.create({
      data: {
        agentId,
        questionIds: JSON.stringify(selectedQuestions.map(q => q.id)),
        totalQuestions: selectedQuestions.length,
        totalScore,
        status: 'in_progress',
        startedAt: new Date(),
        percentage: 0,
        timeSpent: 0,
      },
    });

    return {
      attemptId: attempt.id,
      questions: selectedQuestions.map(q => ({
        id: q.id,
        type: q.type,
        category: q.category,
        difficulty: q.difficulty,
        title: q.title,
        description: q.description,
        codeSnippet: q.codeSnippet,
        options: q.options ? JSON.parse(q.options) : null,
        points: q.points,
      })),
      totalQuestions: selectedQuestions.length,
      totalScore,
      startedAt: attempt.startedAt,
    };
  }

  /**
   * Submit answers for a test attempt
   */
  async submitAnswers(agentId: string, attemptId: string, submitAnswersDto: SubmitAnswersDto) {
    const { answers } = submitAnswersDto;

    // Get the attempt
    const attempt = await this.prisma.agentTestAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Test attempt not found');
    }

    if (attempt.agentId !== agentId) {
      throw new BadRequestException('You are not authorized to submit answers for this attempt');
    }

    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('This test has already been completed');
    }

    const questionIds = JSON.parse(attempt.questionIds);

    // Validate answers
    if (answers.length !== questionIds.length) {
      throw new BadRequestException(`Expected ${questionIds.length} answers, received ${answers.length}`);
    }

    let totalScore = 0;
    const answerRecords = [];

    // Process each answer
    for (const answer of answers) {
      const question = await this.prisma.agentTestQuestion.findUnique({
        where: { id: answer.questionId },
      });

      if (!question) {
        throw new NotFoundException(`Question ${answer.questionId} not found`);
      }

      // Check if answer is correct
      const isCorrect = this.checkAnswer(answer.answer, question.expectedAnswer);
      const points = isCorrect ? question.points : 0;
      totalScore += points;

      // Create answer record
      const answerRecord = await this.prisma.agentTestAnswer.create({
        data: {
          attemptId,
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
          points,
          timeSpent: answer.timeSpent,
        },
      });

      answerRecords.push({
        questionId: answer.questionId,
        isCorrect,
        points,
        explanation: question.explanation,
      });
    }

    // Calculate percentage
    const percentage = (totalScore / attempt.totalScore) * 100;

    // Update attempt
    const updatedAttempt = await this.prisma.agentTestAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        score: totalScore,
        percentage,
        completedAt: new Date(),
        timeSpent: Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000),
      },
    });

    // Determine level
    const level = this.getLevel(percentage);

    return {
      attemptId: updatedAttempt.id,
      score: totalScore,
      totalScore: attempt.totalScore,
      percentage: Math.round(percentage * 100) / 100,
      level,
      answers: answerRecords,
      completedAt: updatedAttempt.completedAt,
      timeSpent: updatedAttempt.timeSpent,
    };
  }

  /**
   * Get test result
   */
  async getResult(agentId: string, attemptId: string) {
    const attempt = await this.prisma.agentTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Test attempt not found');
    }

    if (attempt.agentId !== agentId) {
      throw new BadRequestException('You are not authorized to view this result');
    }

    return {
      attemptId: attempt.id,
      status: attempt.status,
      score: attempt.score,
      totalScore: attempt.totalScore,
      percentage: attempt.percentage,
      level: this.getLevel(attempt.percentage),
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.answers.filter(a => a.isCorrect).length,
      timeSpent: attempt.timeSpent,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      answers: attempt.answers.map(a => ({
        questionId: a.questionId,
        question: a.question.title,
        isCorrect: a.isCorrect,
        points: a.points,
        explanation: a.question.explanation,
      })),
    };
  }

  /**
   * Get agent's test history
   */
  async getHistory(agentId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.agentTestAttempt.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.agentTestAttempt.count({ where: { agentId } }),
    ]);

    return {
      attempts: attempts.map(attempt => ({
        attemptId: attempt.id,
        status: attempt.status,
        score: attempt.score,
        totalScore: attempt.totalScore,
        percentage: attempt.percentage,
        level: this.getLevel(attempt.percentage),
        totalQuestions: attempt.totalQuestions,
        timeSpent: attempt.timeSpent,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if answer is correct
   */
  private checkAnswer(userAnswer: string, expectedAnswer: string): boolean {
    // Normalize answers for comparison
    const normalize = (str: string) => str.toLowerCase().trim();

    // Handle multiple choice (if expectedAnswer is JSON array)
    if (expectedAnswer.startsWith('[')) {
      const expectedOptions = JSON.parse(expectedAnswer);
      return expectedOptions.includes(userAnswer);
    }

    // Handle exact match or keyword match
    const normalizedUser = normalize(userAnswer);
    const normalizedExpected = normalize(expectedAnswer);

    // Check for exact match
    if (normalizedUser === normalizedExpected) {
      return true;
    }

    // Check for keyword match (for longer answers)
    if (normalizedExpected.length > 20) {
      const keywords = normalizedExpected.split(',').map(k => k.trim());
      return keywords.every(keyword => normalizedUser.includes(keyword));
    }

    return false;
  }

  /**
   * Get capability level based on percentage
   */
  private getLevel(percentage: number): string {
    if (percentage >= 85) return 'Gold';
    if (percentage >= 60) return 'Silver';
    return 'Bronze';
  }

  /**
   * Get random items from array
   */
  private getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Seed initial test questions (for development/testing)
   */
  async seedQuestions() {
    const questions = [
      // Code Review Questions
      {
        type: 'code_review',
        category: 'frontend',
        difficulty: 1,
        title: 'Basic React Component Bug',
        description: 'Identify the bug in this React component',
        codeSnippet: `function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={setCount(count + 1)}>Increment</button>
    </div>
  );
}`,
        expectedAnswer: 'useState hook is not imported',
        options: JSON.stringify(['useState hook is not imported', 'Missing return statement', 'Wrong button placement', 'Incorrect variable name']),
        explanation: 'The useState hook needs to be imported from React: import React, { useState } from "react"',
        points: 10,
      },
      {
        type: 'code_review',
        category: 'backend',
        difficulty: 2,
        title: 'SQL Injection Vulnerability',
        description: 'Find the security vulnerability',
        codeSnippet: `app.get('/user/:id', async (req, res) => {
  const query = \`SELECT * FROM users WHERE id = \${req.params.id}\`;
  const result = await db.query(query);
  res.json(result);
});`,
        expectedAnswer: 'SQL injection',
        options: JSON.stringify(['SQL injection', 'XSS vulnerability', 'CSRF vulnerability', 'Memory leak']),
        explanation: 'Direct string concatenation of user input into SQL queries creates SQL injection vulnerabilities. Use parameterized queries instead.',
        points: 15,
      },
      {
        type: 'bug_fix',
        category: 'security',
        difficulty: 3,
        title: 'Authentication Token Storage',
        description: 'What security issue exists in storing tokens?',
        codeSnippet: `localStorage.setItem('authToken', response.token);`,
        expectedAnswer: 'XSS vulnerability',
        options: JSON.stringify(['XSS vulnerability', 'CSRF vulnerability', 'SQL injection', 'Timing attack']),
        explanation: 'localStorage is vulnerable to XSS attacks. Use httpOnly cookies or secure storage mechanisms instead.',
        points: 15,
      },
      {
        type: 'code_review',
        category: 'performance',
        difficulty: 2,
        title: 'Inefficient Loop',
        description: 'What performance issue exists in this code?',
        codeSnippet: `for (let i = 0; i < arr.length; i++) {
  const result = database.findOne(arr[i].id);
  processed.push(result);
}`,
        expectedAnswer: 'N+1 query problem',
        options: JSON.stringify(['N+1 query problem', 'Memory leak', 'Race condition', 'Deadlock']),
        explanation: 'This is the N+1 query problem. Query the database once instead of making individual queries in a loop.',
        points: 12,
      },
      {
        type: 'bug_fix',
        category: 'backend',
        difficulty: 2,
        title: 'Async Error Handling',
        description: 'What error handling issue exists?',
        codeSnippet: `async function processData() {
  const data = await fetchData();
  const processed = data.map(transform);
  return processed;
}`,
        expectedAnswer: 'Missing error handling',
        options: JSON.stringify(['Missing error handling', 'Memory leak', 'Race condition', 'Infinite loop']),
        explanation: 'Async functions should have try-catch blocks to handle potential errors from async operations.',
        points: 10,
      },
      {
        type: 'code_review',
        category: 'frontend',
        difficulty: 2,
        title: 'React useEffect Dependency',
        description: 'What is wrong with this useEffect?',
        codeSnippet: `useEffect(() => {
  fetchData(userId);
}, []);`,
        expectedAnswer: 'Missing dependency',
        options: JSON.stringify(['Missing dependency', 'Infinite loop', 'Memory leak', 'Wrong hook usage']),
        explanation: 'userId should be in the dependency array to ensure the effect runs when userId changes.',
        points: 12,
      },
      {
        type: 'bug_fix',
        category: 'security',
        difficulty: 3,
        title: 'Password Hashing',
        description: 'What security issue exists?',
        codeSnippet: `const hashedPassword = md5(user.password);`,
        expectedAnswer: 'Weak hashing algorithm',
        options: JSON.stringify(['Weak hashing algorithm', 'Missing salt', 'Plaintext storage', 'Timing attack']),
        explanation: 'MD5 is cryptographically broken and vulnerable to collision attacks. Use bcrypt, scrypt, or Argon2 instead.',
        points: 15,
      },
      {
        type: 'code_review',
        category: 'backend',
        difficulty: 3,
        title: 'Race Condition',
        description: 'Identify the concurrency issue',
        codeSnippet: `if (user.balance >= amount) {
  await sleep(100);
  user.balance -= amount;
  await user.save();
}`,
        expectedAnswer: 'Race condition',
        options: JSON.stringify(['Race condition', 'Deadlock', 'Memory leak', 'Infinite loop']),
        explanation: 'Between checking and updating the balance, another transaction could also withdraw, causing negative balance. Use atomic operations or database transactions.',
        points: 15,
      },
      {
        type: 'bug_fix',
        category: 'frontend',
        difficulty: 1,
        title: 'Event Handler Memory Leak',
        description: 'What could cause a memory leak?',
        codeSnippet: `useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);`,
        expectedAnswer: 'Missing cleanup',
        options: JSON.stringify(['Missing cleanup', 'Wrong event', 'Missing dependency', 'Incorrect handler']),
        explanation: 'Event listeners should be cleaned up in the useEffect return function to prevent memory leaks.',
        points: 10,
      },
      {
        type: 'code_review',
        category: 'performance',
        difficulty: 3,
        title: 'Database Index Missing',
        description: 'What would improve query performance?',
        codeSnippet: `SELECT * FROM orders WHERE customer_id = 123 AND created_at > '2024-01-01';`,
        expectedAnswer: 'Add composite index',
        options: JSON.stringify(['Add composite index', 'Use SELECT *', 'Add more RAM', 'Increase cache']),
        explanation: 'Create a composite index on (customer_id, created_at) to significantly improve query performance.',
        points: 15,
      },
    ];

    await this.prisma.agentTestQuestion.createMany({
      data: questions,
      skipDuplicates: true,
    });

    return { message: 'Questions seeded successfully', count: questions.length };
  }
}
