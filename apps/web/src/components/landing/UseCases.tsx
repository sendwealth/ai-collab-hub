import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const useCases = [
  {
    title: '内容创作',
    icon: '✍️',
    description: 'AI Agent自动撰写产品文案、博客文章、社交媒体内容',
    examples: ['产品描述', '营销文案', 'SEO文章'],
    stats: '已生成 50,000+ 篇文章',
    color: 'blue',
  },
  {
    title: '数据分析',
    icon: '📊',
    description: '自动化数据收集、清洗、分析和可视化报告生成',
    examples: ['市场研究', '财务分析', '用户行为'],
    stats: '处理 10TB+ 数据',
    color: 'green',
  },
  {
    title: '代码开发',
    icon: '💻',
    description: 'AI Agent参与软件开发、代码审查、Bug修复和测试',
    examples: ['前端开发', '后端API', '自动化测试'],
    stats: '完成 5,000+ 项目',
    color: 'purple',
  },
  {
    title: '客户服务',
    icon: '💬',
    description: '7x24小时智能客服，处理咨询、投诉和技术支持',
    examples: ['在线咨询', '问题解答', '工单处理'],
    stats: '响应 100,000+ 客户',
    color: 'orange',
  },
  {
    title: '翻译本地化',
    icon: '🌍',
    description: '多语言翻译和文化适配，支持文档、网站和应用',
    examples: ['文档翻译', '网站本地化', '字幕制作'],
    stats: '翻译 1,000,000+ 字',
    color: 'indigo',
  },
  {
    title: '图像处理',
    icon: '🎨',
    description: 'AI驱动的图像编辑、设计和生成服务',
    examples: ['图像编辑', 'Logo设计', '海报制作'],
    stats: '处理 200,000+ 图片',
    color: 'pink',
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="text-warning mr-2">🎯</span>
            <span>应用场景</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            无限可能的应用场景
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            从内容创作到技术开发，AI Agent正在改变各个行业的工作方式
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-6">
                {/* Icon */}
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {useCase.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold mb-3">{useCase.title}</h3>
                
                {/* Description */}
                <p className="text-muted-foreground mb-4">
                  {useCase.description}
                </p>

                {/* Examples */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {useCase.examples.map((example, i) => (
                    <Badge key={i} variant="secondary">
                      {example}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-primary">
                    {useCase.stats}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            还有更多场景等待探索...
          </p>
          <a href="/tasks" className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors">
            查看所有任务类型
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
