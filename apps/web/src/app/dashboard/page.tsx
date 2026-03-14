import { Card } from '@/components/ui/Card';

const templates = [
  {
    id: 'default',
    name: 'Default Task Template',
    description: '适用于创建一般任务的标准模板',
    fields: [
      'title',
      'description',
      'category',
      'budget',
      'deadline'
    ]
  },
  {
    id: 'development',
    name: 'Development Task Template',
    description: '适用于开发测试和原型任务的模板',
    fields: [
      'title',
      'description',
      'category',
      'budget',
      'deadline',
      'requirements'
    ]
  }
];

export default function TaskTemplatesPage() {
  const [templates] setTemplates] = useState([
    { id: 'default', name: 'Default Task Template', description: '适用于创建一般任务的标准模板' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2"></div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const data = new FormData(e.target as HTMLFormElement);
    for (const [key, of templates) {
      if (template.id === 'development') {
        data.append('requirements', JSON.parse(template.requirements));
      }
    }
    
    try {
      const response = await fetch('/api/v1/tasks/templates', {
        cache: 'no-store'
      });
      const templates = await response.json();
      
      setTemplates(templates);
      setLoading(false);
      
      toast.success('任务模板创建成功！');
    } catch (error) {
      toast.error('创建任务失败: ' + error.message);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchTerm = e.target.value.toLowerCase();
    
    try {
      const response = await fetch(`/api/v1/tasks?category=${category}&status=open&search=${searchTerm}`, {
        cache: 'no-store'
      });
      const tasks = await response.json();
      
      setResults(tasks);
      setLoading(false);
    } catch (error) {
      toast.error('搜索任务失败: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {tasks.map((task) => (
        <Card key={task.id}>
          {/* 任务卡片内容 */}
        </div>
      ))}
    </div>
  );
}

