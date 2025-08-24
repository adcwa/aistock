'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

interface SubscriptionInfo {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  planName: string;
  tier: string;
}

export default function SubscriptionManagePage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/subscription/info');
      const result = await response.json();
      
      if (result.success) {
        setSubscription(result.data);
      }
    } catch (error) {
      console.error('Failed to load subscription info:', error);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/subscription/manage`,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Failed to create portal session:', result.error);
      }
    } catch (error) {
      console.error('Failed to manage subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscription) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>加载订阅信息中...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'canceled':
        return 'destructive';
      case 'past_due':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'canceled':
        return '已取消';
      case 'past_due':
        return '逾期';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">订阅管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 订阅信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              订阅详情
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">计划名称:</span>
              <span className="font-semibold">{subscription.planName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">订阅状态:</span>
              <Badge variant={getStatusColor(subscription.status)}>
                {getStatusText(subscription.status)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">订阅ID:</span>
              <span className="text-sm text-gray-600 font-mono">
                {subscription.id}
              </span>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    订阅将在当前计费周期结束后取消
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 计费周期 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              计费周期
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">当前周期开始:</span>
              <span className="text-sm">
                {new Date(subscription.currentPeriodStart).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">当前周期结束:</span>
              <span className="text-sm">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  您可以在Stripe客户门户中管理订阅设置
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 管理按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">管理订阅</h3>
            <p className="text-sm text-gray-600">
              更新支付方式、查看账单历史、更改订阅计划或取消订阅
            </p>
            <Button 
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full max-w-md"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  加载中...
                </>
              ) : (
                '打开客户门户'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle>常见问题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">如何更改订阅计划？</h4>
            <p className="text-sm text-gray-600">
              点击"打开客户门户"按钮，在Stripe客户门户中可以升级或降级您的订阅计划。
            </p>
          </div>
          <div>
            <h4 className="font-semibold">如何取消订阅？</h4>
            <p className="text-sm text-gray-600">
              在Stripe客户门户中可以取消订阅。取消后，您仍可以使用到当前计费周期结束。
            </p>
          </div>
          <div>
            <h4 className="font-semibold">如何更新支付方式？</h4>
            <p className="text-sm text-gray-600">
              在Stripe客户门户中可以添加、删除或更新您的支付方式。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
