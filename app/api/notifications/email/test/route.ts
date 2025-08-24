import { NextRequest, NextResponse } from 'next/server';
import { EmailNotificationService } from '@/lib/services/email-notification';
import { SubscriptionService } from '@/lib/services/subscription';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有邮件通知权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'emailNotification');

    // 发送测试邮件
    await EmailNotificationService.sendTestEmail(session.user.id);
    
    return NextResponse.json({
      success: true,
      message: '测试邮件发送成功，请检查您的邮箱'
    });
  } catch (error) {
    console.error('Failed to send test email:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '发送测试邮件失败' },
      { status: 500 }
    );
  }
}
