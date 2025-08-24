import { NextRequest, NextResponse } from 'next/server';
import { EmailNotificationService } from '@/lib/services/email-notification';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await EmailNotificationService.getEmailLogs(session.user.id, limit);
    
    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Failed to get email logs:', error);
    return NextResponse.json(
      { error: '获取邮件发送记录失败' },
      { status: 500 }
    );
  }
}
