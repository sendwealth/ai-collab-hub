'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceRange {
  minPrice: number;
  maxPrice: number;
  recommendedPrice: number;
  confidence: number;
  marketTrend: 'rising' | 'stable' | 'falling';
  avgMarketPrice: number;
  supplyLevel: string;
  demandLevel: string;
  factors: {
    historicalAvg: number;
    difficultyMultiplier: number;
    supplyDemandRatio: number;
    urgencyBonus: number;
  };
}

interface MarketPrice {
  category: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  demandLevel: 'low' | 'medium' | 'high';
  sampleSize: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export default function PricingTool() {
  const [taskId, setTaskId] = useState('');
  const [category, setCategory] = useState('development');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetPricing = async () => {
    if (!taskId.trim()) {
      setError('请输入任务ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/v1/recommendations/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          category,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('获取价格建议失败');
      }

      const data = await response.json();
      setPriceRange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取价格建议失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGetMarketPrices = async () => {
    if (!category.trim()) {
      setError('请选择任务类别');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/api/v1/recommendations/pricing/history/${category}`);
      if (!response.ok) {
        throw new Error('获取市场价格失败');
      }

      const data = await response.json();
      setMarketPrices([data]); // Wrap in array for display
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取市场价格失败');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDemandBadgeVariant = (demand: string) => {
    switch (demand) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getComplexityBadgeVariant = (complexity: string) => {
    switch (complexity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            任务定价工具
          </CardTitle>
          <CardDescription>
            基于任务类型、复杂度和市场情况的智能定价建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskId">任务ID</Label>
              <Input
                id="taskId"
                placeholder="输入任务ID"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">任务类别</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">开发</SelectItem>
                  <SelectItem value="design">设计</SelectItem>
                  <SelectItem value="testing">测试</SelectItem>
                  <SelectItem value="documentation">文档</SelectItem>
                  <SelectItem value="analysis">分析</SelectItem>
                  <SelectItem value="consulting">咨询</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">难度等级</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGetPricing} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              获取价格建议
            </Button>
            <Button variant="outline" onClick={handleGetMarketPrices} disabled={loading}>
              查看市场价格
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
          )}
        </CardContent>
      </Card>

      {priceRange && (
        <Card>
          <CardHeader>
            <CardTitle>价格建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">推荐价格</p>
                <p className="text-4xl font-bold text-blue-600">
                  {priceRange.recommendedPrice} credits
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">价格范围</p>
                <p className="text-lg font-semibold text-gray-800">
                  {priceRange.minPrice} - {priceRange.maxPrice}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  置信度: {(priceRange.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">市场情况</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">市场趋势:</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(priceRange.marketTrend)}
                      <span className="font-medium capitalize">{priceRange.marketTrend}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均价格:</span>
                    <span className="font-medium">{priceRange.avgMarketPrice} credits</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">供给水平:</span>
                    <Badge variant={getDemandBadgeVariant(priceRange.supplyLevel)}>
                      {priceRange.supplyLevel}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">需求水平:</span>
                    <Badge variant={getDemandBadgeVariant(priceRange.demandLevel)}>
                      {priceRange.demandLevel}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">定价因素</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">历史均价:</span>
                    <span className="font-medium">{priceRange.factors.historicalAvg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">难度系数:</span>
                    <span className="font-medium">×{priceRange.factors.difficultyMultiplier.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">供需比:</span>
                    <span className="font-medium">×{priceRange.factors.supplyDemandRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">紧急程度:</span>
                    <span className="font-medium">×{priceRange.factors.urgencyBonus.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {marketPrices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>市场价格参考</CardTitle>
            <CardDescription>基于最近30天已完成任务的市场数据</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketPrices.map((market) => (
                <div key={market.category} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize">{market.category}</h4>
                    {getTrendIcon(market.trend)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均价格:</span>
                      <span className="font-medium">¥{market.avgPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">价格范围:</span>
                      <span className="text-sm">¥{market.minPrice} - ¥{market.maxPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">需求水平:</span>
                      <Badge variant={getDemandBadgeVariant(market.demandLevel)}>
                        {market.demandLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">样本数量:</span>
                      <span className="text-sm">{market.sampleSize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
