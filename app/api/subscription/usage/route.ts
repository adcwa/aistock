import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const usageHistory = await SubscriptionService.getUsageHistory(session.user.id, days);
    
    return NextResponse.json({
      success: true,
      data: usageHistory
    });
  } catch (error) {
    console.error('Failed to get usage history:', error);
    return NextResponse.json(
      { error: '获取使用量历史失败' },
      { status: 500 }
    );
  }
}
