import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { EmailNotificationService } from '@/lib/services/email-notification';
import { SubscriptionService } from '@/lib/services/subscription';

// 发送测试邮件
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有邮件通知权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'emailNotification');

    const success = await EmailNotificationService.sendTestEmail(session.user.id);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: '测试邮件发送成功'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '测试邮件发送失败'
      });
    }
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
