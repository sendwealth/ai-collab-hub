import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding workflow templates...');

  // Example 1: Code Review Pipeline
  await prisma.workflowTemplate.create({
    data: {
      name: 'Code Review Pipeline',
      description: 'Automated code review with security scan and quality checks',
      category: 'code-review',
      version: '1.0.0',
      definition: JSON.stringify({
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'lint', type: 'task', agentId: 'linter-agent', config: { timeout: 300 } },
          { id: 'security', type: 'task', agentId: 'security-agent', config: { scanDepth: 'deep' } },
          { id: 'review', type: 'task', agentId: 'review-agent', config: { minScore: 7 } },
          { id: 'condition', type: 'condition', condition: '$review.score >= 8' },
          { id: 'approve', type: 'task', agentId: 'merge-agent' },
          { id: 'reject', type: 'task', agentId: 'notify-agent' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'lint' },
          { from: 'lint', to: 'security' },
          { from: 'security', to: 'review' },
          { from: 'review', to: 'condition' },
          { from: 'condition', to: 'approve', condition: true },
          { from: 'condition', to: 'reject', condition: false },
          { from: 'approve', to: 'end' },
          { from: 'reject', to: 'end' },
        ],
      }),
      tags: JSON.stringify(['code-quality', 'security', 'automation']),
      author: 'Nano',
      isActive: true,
    },
  });

  // Example 2: Parallel Analysis
  await prisma.workflowTemplate.create({
    data: {
      name: 'Parallel Data Analysis',
      description: 'Execute multiple analysis tasks in parallel and merge results',
      category: 'data-processing',
      version: '1.0.0',
      definition: JSON.stringify({
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'split', type: 'parallel' },
          { id: 'analyze1', type: 'task', agentId: 'analyst-1', config: { type: 'sentiment' } },
          { id: 'analyze2', type: 'task', agentId: 'analyst-2', config: { type: 'trend' } },
          { id: 'analyze3', type: 'task', agentId: 'analyst-3', config: { type: 'anomaly' } },
          { id: 'merge', type: 'task', agentId: 'merger-agent' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'split' },
          { from: 'split', to: 'analyze1' },
          { from: 'split', to: 'analyze2' },
          { from: 'split', to: 'analyze3' },
          { from: 'analyze1', to: 'merge' },
          { from: 'analyze2', to: 'merge' },
          { from: 'analyze3', to: 'merge' },
          { from: 'merge', to: 'end' },
        ],
      }),
      tags: JSON.stringify(['parallel', 'analysis', 'data-science']),
      author: 'Nano',
      isActive: true,
    },
  });

  // Example 3: Content Creation Workflow
  await prisma.workflowTemplate.create({
    data: {
      name: 'Content Creation Pipeline',
      description: 'Generate, review, and publish content with approval workflow',
      category: 'content-creation',
      version: '1.0.0',
      definition: JSON.stringify({
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'research', type: 'task', agentId: 'research-agent', config: { depth: 'comprehensive' } },
          { id: 'draft', type: 'task', agentId: 'writer-agent', config: { style: 'professional' } },
          { id: 'review', type: 'task', agentId: 'editor-agent' },
          { id: 'check', type: 'condition', condition: '$review.approved === true' },
          { id: 'revise', type: 'loop', config: { maxIterations: 3 } },
          { id: 'publish', type: 'task', agentId: 'publisher-agent' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'research' },
          { from: 'research', to: 'draft' },
          { from: 'draft', to: 'review' },
          { from: 'review', to: 'check' },
          { from: 'check', to: 'publish', condition: true },
          { from: 'check', to: 'revise', condition: false },
          { from: 'revise', to: 'draft' },
          { from: 'publish', to: 'end' },
        ],
      }),
      tags: JSON.stringify(['content', 'writing', 'publishing']),
      author: 'Nano',
      isActive: true,
    },
  });

  console.log('✅ Workflow templates seeded successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
