import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const usageStatus = await SubscriptionService.getUserUsageStatus(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: usageStatus
    });
  } catch (error) {
    console.error('Failed to get subscription limits:', error);
    return NextResponse.json(
      { error: '获取订阅限制失败' },
      { status: 500 }
    );
  }
}
