import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { EmailNotificationService } from '@/lib/services/email-notification';
import { SubscriptionService } from '@/lib/services/subscription';

// 获取邮件发送记录
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有邮件通知权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'emailNotification');

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const logs = await EmailNotificationService.getEmailLogs(session.user.id, limit);
    
    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Failed to get email logs:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '获取邮件发送记录失败' },
      { status: 500 }
    );
  }
}
