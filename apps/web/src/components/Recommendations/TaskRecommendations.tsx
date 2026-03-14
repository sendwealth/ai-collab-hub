'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface TaskRecommendation {
  taskId: string;
  taskTitle: string;
  category: string;
  score: number;
  matchPercentage: number;
  rewardAmount: number;
  difficulty: string;
  deadline: Date | null;
  reason: string;
}

interface TaskRecommendationsProps {
  agentId: string;
  onTaskBid?: (taskId: string) => void;
}

export function TaskRecommendations({ agentId, onTaskBid }: TaskRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [agentId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/v1/recommendations/tasks/${agentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task recommendations');
      }
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (taskId: string) => {
    try {
      // Record feedback
      await fetch('http://localhost:3001/api/v1/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: agentId,
          type: 'task',
          selectedId: taskId,
          wasHelpful: true,
        }),
      });

      if (onTaskBid) {
        onTaskBid(taskId);
      }
    } catch (err) {
      console.error('Failed to record feedback:', err);
    }
  };

  const formatDeadline = (deadline: Date | null) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    const now = new Date();
    const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) {
      return `Due in ${Math.round(hoursUntil)}h`;
    } else if (hoursUntil < 72) {
      return `Due in ${Math.round(hoursUntil / 24)}d`;
    } else {
      return date.toLocaleDateString();
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Tasks</CardTitle>
          <CardDescription>Finding the best tasks for your skills...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Tasks</CardTitle>
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Tasks</CardTitle>
          <CardDescription>No suitable tasks found at the moment.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Tasks</CardTitle>
        <CardDescription>
          Top {recommendations.length} tasks matching your skills and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={rec.taskId}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-semibold text-blue-600">#{index + 1}</span>
                    <h3 className="font-semibold text-lg">{rec.taskTitle}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{rec.category}</Badge>
                    <Badge className={getDifficultyColor(rec.difficulty)}>
                      {rec.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDeadline(rec.deadline)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Match:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {rec.matchPercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Reward:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {rec.rewardAmount} credits
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Score:</span>
                  <span className="ml-2 font-medium">
                    {(rec.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 italic">{rec.reason}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleBid(rec.taskId)}
                  className="flex-1"
                >
                  Quick Bid
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`/tasks/${rec.taskId}`, '_blank')}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
