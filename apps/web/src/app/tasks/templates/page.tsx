'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: {
    title: string;
    description: string;
    category: string;
    reward: { credits: number };
    deadline?: string;
    requirements?: string[];
  };
}

const taskTemplates: TaskTemplate[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Review code for quality, security, and best practices',
    category: 'code-review',
    fields: {
      title: 'Code Review Task',
      description: 'Review code for quality and security',
      category: 'code-review',
      reward: { credits: 50 },
      requirements: ['Code quality check', 'Security analysis', 'Best practices review'],
    },
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix',
    description: 'Fix reported bugs in codebase',
    category: 'development',
    fields: {
      title: 'Bug Fix Task',
      description: 'Fix reported bug',
      category: 'development',
      reward: { credits: 100 },
      requirements: ['Reproduce bug', 'Fix issue', 'Add tests'],
    },
  },
  {
    id: 'feature-dev',
    name: 'Feature Development',
    description: 'Implement new feature',
    category: 'development',
    fields: {
      title: 'Feature Development',
      description: 'Implement new feature',
      category: 'development',
      reward: { credits: 200 },
      requirements: ['Design', 'Implementation', 'Testing', 'Documentation'],
    },
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Integrate third-party API',
    category: 'development',
    fields: {
      title: 'API Integration',
      description: 'Integrate third-party API',
      category: 'development',
      reward: { credits: 150 },
      requirements: ['API research', 'Implementation', 'Error handling', 'Documentation'],
    },
  },
  {
    id: 'unit-testing',
    name: 'Unit Testing',
    description: 'Write comprehensive unit tests',
    category: 'testing',
    fields: {
      title: 'Unit Testing Task',
      description: 'Write unit tests',
      category: 'testing',
      reward: { credits: 75 },
      requirements: ['Test coverage >80%', 'Edge cases', 'Integration tests'],
    },
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Write or update documentation',
    category: 'documentation',
    fields: {
      title: 'Documentation Task',
      description: 'Write documentation',
      category: 'documentation',
      reward: { credits: 50 },
      requirements: ['API docs', 'Usage examples', 'Installation guide'],
    },
  },
];

export default function TaskTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [customFields, setCustomFields] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const selectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setCustomFields({ ...template.fields });
  };

  const handleCreateTask = async () => {
    if (!customFields) return;

    try {
      setLoading(true);
      
      // Create task with template data
      const response = await fetch('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sk_agent_880631ad27c9030d3a01d5edc76f51dc3669b9dcd52699cf9efd43b4dab9cd51',
        },
        body: JSON.stringify(customFields),
      });

      if (response.ok) {
        const task = await response.json();
        router.push(`/tasks/${task.id}`);
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tasks" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Tasks
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Task Templates</h1>
          <p className="text-gray-600 mt-2">Choose a template to quickly create a new task</p>
        </div>

        {!selectedTemplate ? (
          /* Template Selection */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taskTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => selectTemplate(template)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer p-6 border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {template.category}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Budget: ¥{template.fields.reward.credits}</span>
                  <span>{template.fields.requirements?.length || 0} requirements</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Template Customization */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Customize Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={customFields.title}
                    onChange={(e) => setCustomFields({ ...customFields, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={customFields.description}
                    onChange={(e) => setCustomFields({ ...customFields, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={customFields.category}
                    onChange={(e) => setCustomFields({ ...customFields, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="code-review">Code Review</option>
                    <option value="documentation">Documentation</option>
                    <option value="design">Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (¥)
                  </label>
                  <input
                    type="number"
                    value={customFields.reward.credits}
                    onChange={(e) => setCustomFields({
                      ...customFields,
                      reward: { credits: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {customFields.requirements && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements
                    </label>
                    <ul className="list-disc list-inside space-y-1">
                      {customFields.requirements.map((req: string, index: number) => (
                        <li key={index} className="text-gray-600">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
