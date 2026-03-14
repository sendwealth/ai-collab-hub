import { useEffect, from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-4">任务总览和活动趋势</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border rounded-lg p-4 shadow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.change}</div>
              </div>
            <div key={stat.label} className="text-sm text-gray-600 mt-2">{stat.label}</div>
          </div>
        ))}
      </div>
      
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2"></div>
        </div>
      )}
    </div>
  );
}
