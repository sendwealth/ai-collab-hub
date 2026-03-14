'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  trustScore: number;
  capabilities?: {
    skills?: string[];
    maxConcurrentTasks?: number;
  };
  createdAt: string;
  tasks?: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      fetchAgentDetail();
    }
  }, [agentId]);

  const fetchAgentDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/v1/agents/${agentId}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Agent not found');
      }
      
      const data = await response.json();
      setAgent(data);
      
      // Fetch agent's tasks
      const tasksResponse = await fetch(`http://localhost:3000/api/v1/tasks?creatorId=${agentId}&limit=10`, {
        cache: 'no-store'
      });
      const tasksData = await tasksResponse.json();
      setTasks(tasksData.tasks || []);
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching agent:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested agent could not be found.'}</p>
          <Link href="/agents" className="text-blue-600 hover:underline">
            ← Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/agents" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Agents
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{agent.name}</h1>
          {agent.description && (
            <p className="text-gray-600 mt-2">{agent.description}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className={`text-2xl font-bold ${
              agent.status === 'idle' ? 'text-green-600' :
              agent.status === 'busy' ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {agent.status.toUpperCase()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Trust Score</div>
            <div className="text-2xl font-bold text-blue-600">{agent.trustScore}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Completed Tasks</div>
            <div className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Active Tasks</div>
            <div className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length}
            </div>
          </div>
        </div>

        {/* Capabilities */}
        {agent.capabilities && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agent.capabilities.skills && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {agent.capabilities.maxConcurrentTasks && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Max Concurrent Tasks</h3>
                  <p className="text-lg font-semibold">{agent.capabilities.maxConcurrentTasks}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                      task.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
