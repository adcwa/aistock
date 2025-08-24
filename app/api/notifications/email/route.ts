import { NextRequest, NextResponse } from 'next/server';
import { EmailNotificationService } from '@/lib/services/email-notification';
import { SubscriptionService } from '@/lib/services/subscription';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

// 邮件通知设置的验证schema
const emailSettingsSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  isEnabled: z.boolean().optional(),
  morningTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, '时间格式不正确').optional(),
  eveningTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, '时间格式不正确').optional(),
  timezone: z.string().optional(),
  includeWatchlist: z.boolean().optional(),
  includeAnalysis: z.boolean().optional(),
  includeAlerts: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const settings = await EmailNotificationService.getUserSettings(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Failed to get email notification settings:', error);
    return NextResponse.json(
      { error: '获取邮件通知设置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有邮件通知权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'emailNotification');

    const body = await request.json();
    const validatedData = emailSettingsSchema.parse(body);

    const settings = await EmailNotificationService.updateUserSettings(session.user.id, validatedData);
    
    return NextResponse.json({
      success: true,
      data: settings,
      message: '邮件通知设置更新成功'
    });
  } catch (error) {
    console.error('Failed to update email notification settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '更新邮件通知设置失败' },
      { status: 500 }
    );
  }
}
