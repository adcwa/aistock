import { db } from '@/lib/db/drizzle';
import { emailNotifications, emailLogs, users } from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import type { EmailNotification, EmailLog } from '@/lib/db/schema';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplateData {
  userName: string;
  watchlistCount: number;
  alertCount: number;
  watchlistStocks: Array<{ symbol: string }>;
  recentAnalysis: Array<{ symbol: string; recommendation: string; summary: string; confidence: number }>;
  alerts: Array<{ symbol: string; type: string; message: string }>;
}

export class EmailNotificationService {
  // 获取用户的邮件通知设置
  static async getUserSettings(userId: number): Promise<EmailNotification | null> {
    try {
      const settings = await db
        .select()
        .from(emailNotifications)
        .where(eq(emailNotifications.userId, userId))
        .limit(1);

      return settings.length > 0 ? settings[0] : null;
    } catch (error) {
      console.error('Failed to get user email settings:', error);
      return null;
    }
  }

  // 更新用户的邮件通知设置
  static async updateUserSettings(userId: number, settings: Partial<EmailNotification>): Promise<EmailNotification> {
    try {
      const existingSettings = await this.getUserSettings(userId);

      if (existingSettings) {
        const [updated] = await db
          .update(emailNotifications)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(emailNotifications.id, existingSettings.id))
          .returning();

        return updated;
      } else {
        const [newSettings] = await db
          .insert(emailNotifications)
          .values({
            userId,
            email: settings.email || '',
            ...settings,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return newSettings;
      }
    } catch (error) {
      console.error('Failed to update user email settings:', error);
      throw new Error('Failed to update email settings');
    }
  }

  // 发送测试邮件
  static async sendTestEmail(userId: number): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId);
      if (!settings || !settings.email) {
        throw new Error('No email settings found');
      }

      // 记录测试邮件发送日志
      await db.insert(emailLogs).values({
        userId,
        email: settings.email,
        subject: '测试邮件 - AIStock 邮件通知',
        templateName: 'test_email',
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to send test email:', error);
      
      // 记录失败日志
      try {
        const settings = await this.getUserSettings(userId);
        if (settings) {
          await db.insert(emailLogs).values({
            userId,
            email: settings.email,
            subject: '测试邮件 - AIStock 邮件通知',
            templateName: 'test_email',
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            createdAt: new Date()
          });
        }
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
      
      throw error;
    }
  }

  // 获取邮件发送记录
  static async getEmailLogs(userId: number, limit: number = 10): Promise<EmailLog[]> {
    try {
      const logs = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.userId, userId))
        .orderBy(desc(emailLogs.createdAt))
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Failed to get email logs:', error);
      return [];
    }
  }

  // 生成早上报告邮件内容
  static async generateMorningReport(userId: number): Promise<EmailContent> {
    const templateData = await this.getEmailTemplateData(userId, 'morning');
    
    const subject = `📈 早安股票报告 - ${new Date().toLocaleDateString('zh-CN')}`;
    
    const html = this.generateMorningReportHTML(templateData);
    const text = this.generateMorningReportText(templateData);

    return { subject, html, text };
  }

  // 生成晚上报告邮件内容
  static async generateEveningReport(userId: number): Promise<EmailContent> {
    const templateData = await this.getEmailTemplateData(userId, 'evening');
    
    const subject = `📊 晚间股票总结 - ${new Date().toLocaleDateString('zh-CN')}`;
    
    const html = this.generateEveningReportHTML(templateData);
    const text = this.generateEveningReportText(templateData);

    return { subject, html, text };
  }

  // 获取邮件模板数据
  private static async getEmailTemplateData(userId: number, reportType: 'morning' | 'evening'): Promise<EmailTemplateData> {
    // 获取用户信息
    const user = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userName = user[0]?.name || '用户';

    // 简化版本：返回空数据
    const watchlistData: Array<{ symbol: string }> = [];
    const recentAnalysis: Array<{ symbol: string; recommendation: string; summary: string; confidence: number }> = [];
    const alerts: Array<{ symbol: string; type: string; message: string }> = [];

    return {
      userName,
      watchlistCount: 0,
      alertCount: 0,
      watchlistStocks: watchlistData,
      recentAnalysis,
      alerts
    };
  }

  // 生成早上报告HTML
  private static generateMorningReportHTML(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>早安股票报告</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 早安股票报告</h1>
            <p>${new Date().toLocaleDateString('zh-CN')} - 祝您投资顺利！</p>
        </div>

        <div class="section">
            <h2>今日概览</h2>
            <p>您的观察列表中有 <strong>${data.watchlistCount}</strong> 只股票</p>
            <p>今日有 <strong>${data.alertCount}</strong> 个预警触发</p>
        </div>

        <div class="footer">
            <p>此邮件由 AIStock 自动生成</p>
            <p>如需取消订阅，请登录您的账户进行设置</p>
        </div>
    </div>
</body>
</html>`;
  }

  // 生成早上报告文本
  private static generateMorningReportText(data: EmailTemplateData): string {
    return `早安股票报告 - ${new Date().toLocaleDateString('zh-CN')}

今日概览：
- 观察列表股票数量：${data.watchlistCount}
- 今日预警数量：${data.alertCount}

此邮件由 AIStock 自动生成
如需取消订阅，请登录您的账户进行设置`;
  }

  // 生成晚上报告HTML
  private static generateEveningReportHTML(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>晚间股票总结</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 晚间股票总结</h1>
            <p>${new Date().toLocaleDateString('zh-CN')} - 今日市场回顾</p>
        </div>

        <div class="section">
            <h2>今日总结</h2>
            <p>您的观察列表中有 <strong>${data.watchlistCount}</strong> 只股票</p>
            <p>今日有 <strong>${data.alertCount}</strong> 个预警触发</p>
        </div>

        <div class="footer">
            <p>此邮件由 AIStock 自动生成</p>
            <p>如需取消订阅，请登录您的账户进行设置</p>
        </div>
    </div>
</body>
</html>`;
  }

  // 生成晚上报告文本
  private static generateEveningReportText(data: EmailTemplateData): string {
    return `晚间股票总结 - ${new Date().toLocaleDateString('zh-CN')}

今日总结：
- 观察列表股票数量：${data.watchlistCount}
- 今日预警数量：${data.alertCount}

此邮件由 AIStock 自动生成
如需取消订阅，请登录您的账户进行设置`;
  }
}
