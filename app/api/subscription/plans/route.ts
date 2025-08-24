import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '@/lib/types/subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const plans = [
      {
        id: 'free',
        name: '免费版',
        tier: 'free',
        price: 0,
        currency: 'USD',
        interval: 'month' as const,
        features: [
          '基础股票查询',
          '基础AI分析',
          '基础观察列表',
          '社区支持'
        ],
        limits: SUBSCRIPTION_LIMITS[SubscriptionTier.FREE],
        popular: false
      },
      {
        id: 'pro',
        name: '专业版',
        tier: 'pro',
        price: 29,
        currency: 'USD',
        interval: 'month' as const,
        features: [
          '高级股票查询',
          '高级AI分析',
          '扩展观察列表',
          '邮件通知',
          '自定义AI配置',
          '优先支持'
        ],
        limits: SUBSCRIPTION_LIMITS[SubscriptionTier.PRO],
        popular: true
      },
      {
        id: 'enterprise',
        name: '企业版',
        tier: 'enterprise',
        price: 99,
        currency: 'USD',
        interval: 'month' as const,
        features: [
          '无限股票查询',
          '无限AI分析',
          '无限观察列表',
          '高级邮件通知',
          '高级AI配置',
          'API访问',
          '专属支持',
          '自定义集成'
        ],
        limits: SUBSCRIPTION_LIMITS[SubscriptionTier.ENTERPRISE],
        popular: false
      }
    ];

    return NextResponse.json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Failed to get subscription plans:', error);
    return NextResponse.json(
      { error: '获取订阅计划失败' },
      { status: 500 }
    );
  }
}
