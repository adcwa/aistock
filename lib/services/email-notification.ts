import { Resend } from 'resend';
import { db } from '@/lib/db/drizzle';
import { emailNotifications, emailLogs, watchlists, watchlistStocks, stocks, analysisHistory } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import type { EmailNotification, EmailLog } from '@/lib/db/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplateData {
  userName: string;
  watchlistCount: number;
  alertCount: number;
  watchlistStocks: Array<{
    symbol: string;
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
  }>;
  recentAnalysis: Array<{
    symbol: string;
    recommendation: string;
    summary: string;
    confidence: number;
  }>;
  alerts: Array<{
    symbol: string;
    type: string;
    message: string;
  }>;
}

export class EmailNotificationService {
  // 获取用户的邮件通知设置
  static async getUserSettings(userId: number): Promise<EmailNotification | null> {
    const settings = await db
      .select()
      .from(emailNotifications)
      .where(eq(emailNotifications.userId, userId))
      .limit(1);

    return settings.length > 0 ? settings[0] : null;
  }

  // 更新用户的邮件通知设置
  static async updateUserSettings(userId: number, settings: Partial<EmailNotification>): Promise<EmailNotification> {
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
      .select({ name: 'name', email: 'email' })
      .from('users')
      .where(eq('users.id', userId))
      .limit(1);

    const userName = user[0]?.name || '用户';

    // 获取观察列表股票
    const watchlistData = await db
      .select({
        symbol: stocks.symbol,
        currentPrice: 'current_price', // 这里需要从价格表获取最新价格
        priceChange: 'price_change', // 需要计算价格变化
        priceChangePercent: 'price_change_percent'
      })
      .from(watchlists)
      .innerJoin(watchlistStocks, eq(watchlists.id, watchlistStocks.watchlistId))
      .innerJoin(stocks, eq(watchlistStocks.stockId, stocks.id))
      .where(eq(watchlists.userId, userId));

    // 获取最近的分析记录
    const recentAnalysis = await db
      .select({
        symbol: stocks.symbol,
        recommendation: analysisHistory.recommendation,
        summary: analysisHistory.reasoning,
        confidence: analysisHistory.confidence
      })
      .from(analysisHistory)
      .innerJoin(stocks, eq(analysisHistory.stockId, stocks.id))
      .where(and(
        eq(analysisHistory.userId, userId),
        gte(analysisHistory.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // 最近24小时
      ))
      .orderBy(desc(analysisHistory.createdAt))
      .limit(5);

    // 获取预警信息（这里需要根据实际的预警表结构调整）
    const alerts: Array<{ symbol: string; type: string; message: string }> = [];

    return {
      userName,
      watchlistCount: watchlistData.length,
      alertCount: alerts.length,
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
        .stock-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: white; border-radius: 5px; }
        .price-up { color: #28a745; }
        .price-down { color: #dc3545; }
        .analysis-item { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #007bff; border-radius: 5px; }
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

        ${data.watchlistStocks.length > 0 ? `
        <div class="section">
            <h2>观察列表概览</h2>
            ${data.watchlistStocks.map(stock => `
                <div class="stock-item">
                    <span><strong>${stock.symbol}</strong></span>
                    <span class="${stock.priceChange >= 0 ? 'price-up' : 'price-down'}">
                        $${stock.currentPrice} (${stock.priceChange >= 0 ? '+' : ''}${stock.priceChangePercent}%)
                    </span>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.recentAnalysis.length > 0 ? `
        <div class="section">
            <h2>最新分析</h2>
            ${data.recentAnalysis.map(analysis => `
                <div class="analysis-item">
                    <h3>${analysis.symbol} - ${analysis.recommendation}</h3>
                    <p>${analysis.summary}</p>
                    <small>置信度: ${(analysis.confidence * 100).toFixed(1)}%</small>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>此邮件由 AIStock 自动生成</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">查看完整报告</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // 生成早上报告文本
  private static generateMorningReportText(data: EmailTemplateData): string {
    return `
早安股票报告 - ${new Date().toLocaleDateString('zh-CN')}

今日概览：
- 观察列表股票数量: ${data.watchlistCount}
- 今日预警数量: ${data.alertCount}

${data.watchlistStocks.length > 0 ? `
观察列表概览：
${data.watchlistStocks.map(stock => 
  `${stock.symbol}: $${stock.currentPrice} (${stock.priceChange >= 0 ? '+' : ''}${stock.priceChangePercent}%)`
).join('\n')}
` : ''}

${data.recentAnalysis.length > 0 ? `
最新分析：
${data.recentAnalysis.map(analysis => 
  `${analysis.symbol} - ${analysis.recommendation} (置信度: ${(analysis.confidence * 100).toFixed(1)}%)\n${analysis.summary}`
).join('\n\n')}
` : ''}

查看完整报告: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `;
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
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .stock-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: white; border-radius: 5px; }
        .price-up { color: #28a745; }
        .price-down { color: #dc3545; }
        .analysis-item { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #007bff; border-radius: 5px; }
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

        ${data.watchlistStocks.length > 0 ? `
        <div class="section">
            <h2>观察列表表现</h2>
            ${data.watchlistStocks.map(stock => `
                <div class="stock-item">
                    <span><strong>${stock.symbol}</strong></span>
                    <span class="${stock.priceChange >= 0 ? 'price-up' : 'price-down'}">
                        $${stock.currentPrice} (${stock.priceChange >= 0 ? '+' : ''}${stock.priceChangePercent}%)
                    </span>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.recentAnalysis.length > 0 ? `
        <div class="section">
            <h2>今日分析回顾</h2>
            ${data.recentAnalysis.map(analysis => `
                <div class="analysis-item">
                    <h3>${analysis.symbol} - ${analysis.recommendation}</h3>
                    <p>${analysis.summary}</p>
                    <small>置信度: ${(analysis.confidence * 100).toFixed(1)}%</small>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>此邮件由 AIStock 自动生成</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">查看完整报告</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // 生成晚上报告文本
  private static generateEveningReportText(data: EmailTemplateData): string {
    return `
晚间股票总结 - ${new Date().toLocaleDateString('zh-CN')}

今日总结：
- 观察列表股票数量: ${data.watchlistCount}
- 今日预警数量: ${data.alertCount}

${data.watchlistStocks.length > 0 ? `
观察列表表现：
${data.watchlistStocks.map(stock => 
  `${stock.symbol}: $${stock.currentPrice} (${stock.priceChange >= 0 ? '+' : ''}${stock.priceChangePercent}%)`
).join('\n')}
` : ''}

${data.recentAnalysis.length > 0 ? `
今日分析回顾：
${data.recentAnalysis.map(analysis => 
  `${analysis.symbol} - ${analysis.recommendation} (置信度: ${(analysis.confidence * 100).toFixed(1)}%)\n${analysis.summary}`
).join('\n\n')}
` : ''}

查看完整报告: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `;
  }

  // 发送邮件
  static async sendEmail(userId: number, emailContent: EmailContent, templateName: string): Promise<void> {
    const settings = await this.getUserSettings(userId);
    
    if (!settings || !settings.isEnabled) {
      throw new Error('邮件通知未启用');
    }

    try {
      // 发送邮件
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@aistock.com',
        to: settings.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });

      // 记录发送日志
      await db.insert(emailLogs).values({
        userId,
        email: settings.email,
        subject: emailContent.subject,
        templateName,
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date()
      });

      console.log('Email sent successfully:', result);
    } catch (error) {
      // 记录发送失败日志
      await db.insert(emailLogs).values({
        userId,
        email: settings.email,
        subject: emailContent.subject,
        templateName,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date()
      });

      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // 获取邮件发送记录
  static async getEmailLogs(userId: number, limit: number = 50): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.userId, userId))
      .orderBy(desc(emailLogs.createdAt))
      .limit(limit);
  }

  // 发送测试邮件
  static async sendTestEmail(userId: number): Promise<void> {
    const testContent: EmailContent = {
      subject: '🧪 AIStock 邮件通知测试',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>邮件通知测试</h2>
          <p>这是一封测试邮件，用于验证您的邮件通知设置是否正确。</p>
          <p>如果您收到这封邮件，说明邮件通知功能正常工作。</p>
          <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
      `,
      text: `
邮件通知测试

这是一封测试邮件，用于验证您的邮件通知设置是否正确。
如果您收到这封邮件，说明邮件通知功能正常工作。

发送时间: ${new Date().toLocaleString('zh-CN')}
      `
    };

    await this.sendEmail(userId, testContent, 'test');
  }
}
