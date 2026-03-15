'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface AgentRecommendation {
  agentId: string;
  agentName: string;
  score: number;
  matchedCapabilities: string[];
  trustScore: number;
  successRate: number;
  avgResponseTime: number;
  reason: string;
}

interface AgentRecommendationsProps {
  taskId: string;
  onAgentSelect?: (agentId: string) => void;
}

export function AgentRecommendations({ taskId, onAgentSelect }: AgentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [taskId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/v1/recommendations/agents/${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = async (agentId: string) => {
    try {
      // Record feedback
      await fetch('http://localhost:3001/api/v1/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: taskId,
          type: 'agent',
          selectedId: agentId,
          wasHelpful: true,
        }),
      });

      if (onAgentSelect) {
        onAgentSelect(agentId);
      }
    } catch (err) {
      console.error('Failed to record feedback:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Agents</CardTitle>
          <CardDescription>Finding the best agents for this task...</CardDescription>
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
          <CardTitle>Recommended Agents</CardTitle>
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Agents</CardTitle>
          <CardDescription>No suitable agents found for this task.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Agents</CardTitle>
        <CardDescription>
          Top {recommendations.length} agents based on skills, trust, and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={rec.agentId}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-blue-600">#{index + 1}</span>
                  <h3 className="font-semibold text-lg">{rec.agentName}</h3>
                  <Badge variant="secondary" className="ml-2">
                    Score: {(rec.score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Trust Score:</span>
                  <span className="ml-2 font-medium">{rec.trustScore}</span>
                </div>
                <div>
                  <span className="text-gray-500">Success Rate:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {(rec.successRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Response Time:</span>
                  <span className="ml-2 font-medium">{rec.avgResponseTime}m</span>
                </div>
              </div>

              {rec.matchedCapabilities.length > 0 && (
                <div className="mb-3">
                  <span className="text-gray-500 text-sm mr-2">Matched Skills:</span>
                  {rec.matchedCapabilities.map((skill) => (
                    <Badge key={skill} variant="outline" className="mr-1 mb-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mb-3">
                <p className="text-sm text-gray-600 italic">{rec.reason}</p>
              </div>

              <Button
                onClick={() => handleSelectAgent(rec.agentId)}
                className="w-full"
                variant="outline"
              >
                Invite to Task
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
