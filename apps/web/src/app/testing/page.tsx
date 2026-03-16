'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TestSession {
  sessionId: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, number>;
  startedAt: string;
  timeLimit: number;
}

interface TestResult {
  sessionId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  level: 'Bronze' | 'Silver' | 'Gold';
  passed: boolean;
  dimensions: {
    category: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
  completedAt: string;
  timeSpent: number;
}

export default function TestingPage() {
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (session?.startedAt) {
      const startTime = new Date(session.startedAt).getTime();
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = session.timeLimit - elapsed;
        setTimeRemaining(remaining > 0 ? remaining : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const startTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3007/api/v1/agent-testing/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start test');
      }

      const data = await response.json();
      const testSession: TestSession = {
        ...data,
        answers: new Map(),
      };
      setSession(testSession);
      setCurrentQuestion(data.questions[0]);
      setTimeRemaining(data.timeLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
      console.error('Error starting test:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !currentQuestion || selectedAnswer === null) return;

    const updatedAnswers = new Map(session.answers);
    updatedAnswers.set(currentQuestion.id, selectedAnswer);

    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex < session.questions.length) {
      setSession({
        ...session,
        currentQuestionIndex: nextIndex,
        answers: updatedAnswers,
      });
      setCurrentQuestion(session.questions[nextIndex]);
      setSelectedAnswer(null);
    } else {
      await submitAllAnswers(updatedAnswers);
    }
  };

  const submitAllAnswers = async (answers: Map<string, number>) => {
    if (!session) return;

    setLoading(true);
    try {
      const answersArray = Array.from(answers.entries()).map(([questionId, answer]) => ({
        questionId,
        selectedAnswer: answer,
      }));

      const response = await fetch('http://localhost:3007/api/v1/agent-testing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          answers: answersArray,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }

      const data: TestResult = await response.json();
      setResult(data);
      setSession(null);
      setCurrentQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
      console.error('Error submitting answers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Gold':
        return 'text-yellow-600';
      case 'Silver':
        return 'text-gray-500';
      case 'Bronze':
        return 'text-orange-700';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => setError(null)} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
            <p className="text-gray-600 mt-2">Your performance summary</p>
          </div>

          <div className="space-y-6">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-6xl font-bold mb-2">{result.percentage}%</div>
                  <div className={`text-3xl font-semibold mb-4 ${getLevelColor(result.level)}`}>
                    {result.level} Certified
                  </div>
                  <p className="text-gray-600">
                    {result.score} out of {result.totalQuestions} questions correct
                  </p>
                  <Badge className={result.passed ? 'bg-green-100 text-green-800 mt-4' : 'bg-red-100 text-red-800 mt-4'}>
                    {result.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Capability Analysis</CardTitle>
                <CardDescription>Performance by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.dimensions.map((dimension, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{dimension.category}</span>
                        <span className="text-gray-600">
                          {dimension.correct}/{dimension.total} ({dimension.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${dimension.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Test Details */}
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Time Spent</p>
                    <p className="text-lg font-semibold">{Math.floor(result.timeSpent / 60)} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-lg font-semibold">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={startTest} size="lg" className="w-full">
              Retake Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Agent Capability Testing</h1>
            <p className="text-gray-600 mt-2">Test your AI agent capabilities and get certified</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>About the Test</CardTitle>
              <CardDescription>10 questions across multiple categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Code Generation</h3>
                    <p className="text-sm text-gray-600">Generate and optimize code</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Problem Solving</h3>
                    <p className="text-sm text-gray-600">Analyze and solve problems</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">API Integration</h3>
                    <p className="text-sm text-gray-600">Work with APIs and data</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium">System Design</h3>
                    <p className="text-sm text-gray-600">Design scalable systems</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>⏱️ Time Limit: 30 minutes</span>
                  <span>📝 Questions: 10</span>
                  <span>🎯 Passing: 70%</span>
                </div>
              </div>

              <Button onClick={startTest} size="lg" className="w-full">
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question {session.currentQuestionIndex + 1}/{session.questions.length}</h1>
            <p className="text-gray-600 mt-2">
              {currentQuestion?.category}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">{formatTime(timeRemaining)}</div>
            <p className="text-sm text-gray-600">Time Remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((session.currentQuestionIndex + 1) / session.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{currentQuestion?.question}</CardTitle>
              <Badge className={getDifficultyColor(currentQuestion?.difficulty || 'medium')}>
                {currentQuestion?.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {selectedAnswer === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={submitAnswer}
                disabled={selectedAnswer === null}
                size="lg"
                className="flex-1"
              >
                {session.currentQuestionIndex === session.questions.length - 1 ? 'Submit Test' : 'Next Question'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
