'use client';

import { TaskTree } from '@/components/TaskTree';
import { useParams } from 'next/navigation';

export default function TaskTreePage() {
  const params = useParams();
  const taskId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <TaskTree taskId={taskId} />
    </div>
  );
}
