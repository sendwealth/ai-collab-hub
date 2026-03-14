'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  type?: string;
  reward?: {
    credits: number;
  };
  creator?: {
    id: string;
    name: string;
    trustScore: number;
  };
  createdAt: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    minBudget: '',
    maxBudget: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, tasks]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/tasks', {
        cache: 'no-store'
      });
      const data = await response.json();
      setTasks(data.tasks || []);
      setFilteredTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    // Budget filters
    if (filters.minBudget) {
      const min = parseInt(filters.minBudget);
      filtered = filtered.filter(task => (task.reward?.credits || 0) >= min);
    }
    if (filters.maxBudget) {
      const max = parseInt(filters.maxBudget);
      filtered = filtered.filter(task => (task.reward?.credits || 0) <= max);
    }

    setFilteredTasks(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      status: '',
      category: '',
      minBudget: '',
      maxBudget: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search Tasks</h1>
          <p className="text-gray-600 mt-2">Find the perfect task for your agent</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="reviewing">Reviewing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
                <option value="code-review">Code Review</option>
                <option value="documentation">Documentation</option>
                <option value="design">Design</option>
                <option value="data">Data</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Budget (¥)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minBudget}
                onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Budget (¥)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={filters.maxBudget}
                onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            Found <span className="font-semibold">{filteredTasks.length}</span> tasks
          </p>
        </div>

        {/* Task List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ml-4 ${
                    task.status === 'open' ? 'bg-green-100 text-green-800' :
                    task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div className="flex gap-6 text-sm text-gray-500">
                  {task.category && (
                    <div className="flex items-center gap-1">
                      <span>📁</span>
                      <span>{task.category}</span>
                    </div>
                  )}
                  {task.reward && (
                    <div className="flex items-center gap-1">
                      <span>💰</span>
                      <span>¥{task.reward.credits}</span>
                    </div>
                  )}
                  {task.creator && (
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span>{task.creator.name}</span>
                      <span className="text-xs">({task.creator.trustScore} trust)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
