'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, Shield, Users, BarChart3, Mail, Settings } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    dailyQueries: number;
    aiAnalysisPerDay: number;
    watchlistLimit: number;
    emailNotifications: boolean;
    customAIConfig: boolean;
    advancedFeatures: boolean;
  };
  popular?: boolean;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPlans();
    loadCurrentPlan();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      const result = await response.json();
      
      if (result.success) {
        setPlans(result.data);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadCurrentPlan = async () => {
    try {
      const response = await fetch('/api/subscription/limits');
      const result = await response.json();
      
      if (result.success) {
        setCurrentPlan(result.data);
      }
    } catch (error) {
      console.error('Failed to load current plan:', error);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Failed to create checkout session:', result.error);
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('查询')) return <Zap className="h-4 w-4" />;
    if (feature.includes('AI')) return <Star className="h-4 w-4" />;
    if (feature.includes('邮件')) return <Mail className="h-4 w-4" />;
    if (feature.includes('配置')) return <Settings className="h-4 w-4" />;
    if (feature.includes('观察')) return <BarChart3 className="h-4 w-4" />;
    if (feature.includes('支持')) return <Users className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">选择适合您的计划</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          从免费版开始，随着您的需求增长升级到更高级的计划
        </p>
      </div>

      {currentPlan && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">当前计划</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>计划级别:</span>
              <Badge variant="outline" className="capitalize">
                {currentPlan.tier}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>今日查询:</span>
              <span className="text-sm">
                {currentPlan.currentUsage.queriesUsed} / {currentPlan.limits.dailyQueries}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>AI分析:</span>
              <span className="text-sm">
                {currentPlan.currentUsage.aiAnalysisUsed} / {currentPlan.limits.aiAnalysisPerDay}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>观察列表:</span>
              <span className="text-sm">
                {currentPlan.currentUsage.watchlistCount} / {currentPlan.limits.watchlistLimit}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  最受欢迎
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.tier === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
                {plan.name}
              </CardTitle>
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
                </div>
                {plan.price === 0 && (
                  <p className="text-sm text-gray-500">永远免费</p>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-semibold">功能限制</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>每日查询</span>
                    <span className="font-medium">{plan.limits.dailyQueries.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI分析</span>
                    <span className="font-medium">{plan.limits.aiAnalysisPerDay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>观察列表</span>
                    <span className="font-medium">{plan.limits.watchlistLimit}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">包含功能</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {getFeatureIcon(feature)}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={isLoading || (currentPlan?.tier === plan.tier)}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    处理中...
                  </>
                ) : currentPlan?.tier === plan.tier ? (
                  '当前计划'
                ) : plan.price === 0 ? (
                  '开始使用'
                ) : (
                  '升级计划'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">为什么选择 AIStock？</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <Shield className="h-8 w-8 mx-auto text-blue-600" />
            <h3 className="font-semibold">安全可靠</h3>
            <p className="text-sm text-gray-600">
              银行级安全加密，保护您的数据和API密钥
            </p>
          </div>
          <div className="space-y-2">
            <Zap className="h-8 w-8 mx-auto text-blue-600" />
            <h3 className="font-semibold">快速准确</h3>
            <p className="text-sm text-gray-600">
              实时数据更新，AI驱动的智能分析
            </p>
          </div>
          <div className="space-y-2">
            <Users className="h-8 w-8 mx-auto text-blue-600" />
            <h3 className="font-semibold">专业支持</h3>
            <p className="text-sm text-gray-600">
              7x24小时技术支持，专业团队为您服务
            </p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">常见问题</h2>
        <div className="max-w-2xl mx-auto space-y-4 text-left">
          <div>
            <h3 className="font-semibold">可以随时取消订阅吗？</h3>
            <p className="text-sm text-gray-600">
              是的，您可以随时取消订阅。取消后，您仍可以使用到当前计费周期结束。
            </p>
          </div>
          <div>
            <h3 className="font-semibold">支持哪些支付方式？</h3>
            <p className="text-sm text-gray-600">
              我们支持所有主要信用卡、借记卡和数字钱包支付。
            </p>
          </div>
          <div>
            <h3 className="font-semibold">数据会丢失吗？</h3>
            <p className="text-sm text-gray-600">
              不会，您的所有数据都会安全保存，即使降级到免费计划也不会丢失。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
