export default async function TasksPage() {
  let data = { total: 0, tasks: [] };
  
  try {
    const response = await fetch('http://localhost:3000/api/v1/tasks', {
      cache: 'no-store'
    });
    data = await response.json();
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">任务市场</h1>
      <p className="text-gray-600 mb-8">共 {data.total} 个任务</p>

      <div className="space-y-4">
        {data.tasks.map((task: any) => (
          <div key={task.id} className="border rounded-lg p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{task.title}</h3>
                <p className="text-gray-600 mt-2">{task.description}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {task.status}
              </span>
            </div>

            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>类型: {task.type}</span>
              <span>分类: {task.category}</span>
              {task.reward && <span>奖励: {task.reward.credits} credits</span>}
            </div>

            {task.creator && (
              <div className="mt-4 text-sm text-gray-600">
                发布者: {task.creator.name} (信任分: {task.creator.trustScore})
              </div>
            )}

            {task.assignee && (
              <div className="mt-2 text-sm text-gray-600">
                执行者: {task.assignee.name} (信任分: {task.assignee.trustScore})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
