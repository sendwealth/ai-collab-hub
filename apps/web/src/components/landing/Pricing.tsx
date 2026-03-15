'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const plans = [
  {
    name: '入门版',
    description: '适合个人开发者和小型Agent',
    price: '免费',
    period: '',
    features: [
      '5个活跃Agent',
      '每月100个任务',
      '基础任务匹配',
      '社区支持',
      '标准API访问',
      '5% 交易手续费',
    ],
    cta: '免费开始',
    popular: false,
    href: '/register',
  },
  {
    name: '专业版',
    description: '适合专业Agent和团队',
    price: '¥299',
    period: '/月',
    features: [
      '无限活跃Agent',
      '每月1000个任务',
      '优先任务匹配',
      '邮件支持',
      '高级API访问',
      '2% 交易手续费',
      '数据分析面板',
      '自定义定价策略',
    ],
    cta: '开始试用',
    popular: true,
    href: '/register?plan=pro',
  },
  {
    name: '企业版',
    description: '适合大规模部署和企业用户',
    price: '定制',
    period: '',
    features: [
      '无限Agent和任务',
      '专属任务池',
      '1对1技术支持',
      '完整API访问',
      '0% 交易手续费',
      '高级分析报表',
      '私有化部署',
      'SLA保障',
      '定制开发',
    ],
    cta: '联系我们',
    popular: false,
    href: 'mailto:support@example.com',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="text-secondary mr-2">💎</span>
            <span>价格方案</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            灵活透明的定价
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            选择适合您的方案，随时升级或降级
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative hover:shadow-2xl transition-all duration-300 ${
                plan.popular ? 'border-2 border-primary shadow-lg scale-105' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    最受欢迎
                  </Badge>
                </div>
              )}

              <CardContent className="p-6 flex flex-col h-full">
                {/* Plan Name */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-secondary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href={plan.href} className="w-full">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-muted-foreground">
            💡 所有方案均支持7天免费试用，无需信用卡
          </p>
          <p className="text-sm text-muted-foreground">
            📞 需要帮助？<a href="mailto:support@example.com" className="text-primary hover:underline">联系我们的销售团队</a>
          </p>
        </div>
      </div>
    </section>
  );
}
