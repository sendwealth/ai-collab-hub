import { Task } from '@/components/tasks/TaskCard';

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: '产品描述文案撰写',
    description: '需要为10个新产品撰写吸引人的产品描述文案，每个产品200-300字。要求突出产品特点，语言生动有趣。',
    category: 'content',
    budget: { min: 500, max: 1000 },
    deadline: '2026-03-25',
    skills: ['文案写作', '电商'],
    status: 'open',
    creator: { name: '张三', trustScore: 4.8 },
  },
  {
    id: 'task-2',
    title: '企业官网UI设计',
    description: '设计一套企业官网UI界面，包括首页、产品页、关于我们等5个页面。需要提供Figma源文件和切图。',
    category: 'design',
    budget: { min: 3000, max: 5000 },
    deadline: '2026-04-01',
    skills: ['UI设计', 'Figma'],
    status: 'open',
    creator: { name: '李四', trustScore: 4.5 },
  },
  {
    id: 'task-3',
    title: 'Python数据分析脚本',
    description: '编写Python脚本分析销售数据，生成可视化报表。数据量约10万条记录，需要处理缺失值和异常值。',
    category: 'data',
    budget: { min: 1500, max: 2500 },
    deadline: '2026-03-22',
    skills: ['Python', '数据分析'],
    status: 'in_progress',
    creator: { name: '王五', trustScore: 4.9 },
  },
  {
    id: 'task-4',
    title: 'React前端开发',
    description: '开发一个任务管理应用的前端界面，使用React + TypeScript，需要实现任务的增删改查和拖拽排序功能。',
    category: 'development',
    budget: { min: 2000, max: 3500 },
    deadline: '2026-04-05',
    skills: ['前端开发', 'JavaScript', 'React'],
    status: 'open',
    creator: { name: '赵六', trustScore: 4.7 },
  },
  {
    id: 'task-5',
    title: '产品宣传视频剪辑',
    description: '剪辑一支30秒的产品宣传视频，提供原始素材。需要添加字幕、背景音乐和简单的转场效果。',
    category: 'content',
    budget: { min: 800, max: 1500 },
    deadline: '2026-03-28',
    skills: ['视频剪辑'],
    status: 'open',
    creator: { name: '孙七', trustScore: 4.6 },
  },
  {
    id: 'task-6',
    title: '技术文档翻译',
    description: '将英文技术文档翻译成中文，约5000词。要求准确理解技术术语，保持原文的专业性和准确性。',
    category: 'translation',
    budget: { min: 600, max: 1200 },
    deadline: '2026-03-30',
    skills: ['翻译', '技术写作'],
    status: 'completed',
    creator: { name: '周八', trustScore: 4.9 },
  },
  {
    id: 'task-7',
    title: '社交媒体营销方案',
    description: '制定一个月的社交媒体营销方案，包括内容策划、发布计划和数据分析指标。目标平台为微信、微博和小红书。',
    category: 'marketing',
    budget: { min: 2000, max: 4000 },
    deadline: '2026-04-10',
    skills: ['营销推广', '社交媒体'],
    status: 'open',
    creator: { name: '吴九', trustScore: 4.4 },
  },
  {
    id: 'task-8',
    title: 'API接口开发',
    description: '开发RESTful API接口，包括用户认证、数据查询和文件上传功能。使用Node.js + Express框架。',
    category: 'development',
    budget: { min: 3000, max: 5000 },
    deadline: '2026-04-08',
    skills: ['后端开发', 'JavaScript'],
    status: 'open',
    creator: { name: '郑十', trustScore: 4.8 },
  },
];

export function filterTasks(tasks: Task[], filters: {
  category: string;
  minPrice: number;
  maxPrice: number;
  status: string;
  skills: string[];
}): Task[] {
  return tasks.filter(task => {
    // 类别筛选
    if (filters.category !== 'all' && task.category !== filters.category) {
      return false;
    }

    // 价格筛选
    if (filters.minPrice > 0 && task.budget.max < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice > 0 && task.budget.min > filters.maxPrice) {
      return false;
    }

    // 状态筛选
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // 技能筛选
    if (filters.skills.length > 0) {
      const hasRequiredSkill = filters.skills.some(skill =>
        task.skills.some(taskSkill => 
          taskSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (!hasRequiredSkill) {
        return false;
      }
    }

    return true;
  });
}
