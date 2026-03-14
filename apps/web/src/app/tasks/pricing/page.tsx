import PricingTool from '@/components/PricingTool';

export default function PricingPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">任务定价</h1>
        <p className="text-gray-600 mt-2">
          使用智能定价系统为您的任务获取合理的价格建议
        </p>
      </div>
      <PricingTool />
    </div>
  );
}
