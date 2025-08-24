import { db } from '@/lib/db/drizzle';
import { usageTracking, teams, teamMembers } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { SubscriptionTier, SUBSCRIPTION_LIMITS, type UsageStatus } from '@/lib/types/subscription';

export class SubscriptionService {
  // 获取用户的订阅级别
  static async getUserTier(userId: number): Promise<SubscriptionTier> {
    try {
      // 通过用户找到团队，然后获取团队的订阅级别
      const teamMember = await db
        .select({
          teamId: teams.id,
          planName: teams.planName
        })
        .from(teams)
        .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
        .where(eq(teamMembers.userId, userId))
        .limit(1);

      if (teamMember.length === 0) {
        return SubscriptionTier.FREE;
      }

      const planName = teamMember[0].planName;
      
      switch (planName?.toLowerCase()) {
        case 'pro':
          return SubscriptionTier.PRO;
        case 'enterprise':
          return SubscriptionTier.ENTERPRISE;
        default:
          return SubscriptionTier.FREE;
      }
    } catch (error) {
      console.error('Error getting user tier:', error);
      return SubscriptionTier.FREE;
    }
  }

  // 获取用户的使用状态
  static async getUserUsageStatus(userId: number): Promise<UsageStatus> {
    const tier = await this.getUserTier(userId);
    const limits = SUBSCRIPTION_LIMITS[tier];
    
    // 获取今日使用量
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const usage = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.date, todayStr)
      ))
      .limit(1);

    const currentUsage = usage.length > 0 ? usage[0] : {
      queriesUsed: 0,
      aiAnalysisUsed: 0,
      watchlistCount: 0
    };

    // 处理可能为null的值
    const queriesUsed = currentUsage.queriesUsed ?? 0;
    const aiAnalysisUsed = currentUsage.aiAnalysisUsed ?? 0;
    const watchlistCount = currentUsage.watchlistCount ?? 0;

    const remaining = {
      queriesRemaining: Math.max(0, limits.dailyQueries - queriesUsed),
      aiAnalysisRemaining: Math.max(0, limits.aiAnalysisPerDay - aiAnalysisUsed),
      watchlistRemaining: Math.max(0, limits.watchlistLimit - watchlistCount)
    };

    const isOverLimit = 
      queriesUsed > limits.dailyQueries ||
      aiAnalysisUsed > limits.aiAnalysisPerDay ||
      watchlistCount > limits.watchlistLimit;

    return {
      tier,
      limits,
      currentUsage: {
        queriesUsed,
        aiAnalysisUsed,
        watchlistCount
      },
      remaining,
      isOverLimit
    };
  }

  // 记录查询使用量
  static async recordQueryUsage(userId: number): Promise<void> {
    await this.incrementUsage(userId, 'queriesUsed');
  }

  // 记录AI分析使用量
  static async recordAIAnalysisUsage(userId: number): Promise<void> {
    await this.incrementUsage(userId, 'aiAnalysisUsed');
  }

  // 更新观察列表数量
  static async updateWatchlistCount(userId: number, count: number): Promise<void> {
    await this.setUsage(userId, 'watchlistCount', count);
  }

  // 检查用户是否有权限执行某个操作
  static async checkPermission(userId: number, action: 'query' | 'aiAnalysis' | 'watchlist' | 'emailNotification' | 'customAIConfig'): Promise<boolean> {
    const usageStatus = await this.getUserUsageStatus(userId);
    const limits = usageStatus.limits;

    switch (action) {
      case 'query':
        return usageStatus.remaining.queriesRemaining > 0;
      case 'aiAnalysis':
        return usageStatus.remaining.aiAnalysisRemaining > 0;
      case 'watchlist':
        return usageStatus.remaining.watchlistRemaining > 0;
      case 'emailNotification':
        return limits.emailNotifications;
      case 'customAIConfig':
        return limits.customAIConfig;
      default:
        return false;
    }
  }

  // 检查并抛出限制异常
  static async checkAndThrowLimit(userId: number, action: 'query' | 'aiAnalysis' | 'watchlist' | 'emailNotification' | 'customAIConfig'): Promise<void> {
    const usageStatus = await this.getUserUsageStatus(userId);
    const limits = usageStatus.limits;
    const tier = usageStatus.tier;
    
    let hasPermission = false;
    let message = '';
    
    switch (action) {
      case 'query':
        hasPermission = usageStatus.remaining.queriesRemaining > 0;
        if (!hasPermission) {
          message = `您已达到 ${tier} 计划的每日查询限制 (${limits.dailyQueries})。请升级到更高级别的计划以获得更多查询次数。`;
        }
        break;
      case 'aiAnalysis':
        hasPermission = usageStatus.remaining.aiAnalysisRemaining > 0;
        if (!hasPermission) {
          message = `您已达到 ${tier} 计划的每日AI分析限制 (${limits.aiAnalysisPerDay})。请升级到更高级别的计划以获得更多AI分析次数。`;
        }
        break;
      case 'watchlist':
        hasPermission = usageStatus.remaining.watchlistRemaining > 0;
        if (!hasPermission) {
          message = `您已达到 ${tier} 计划的观察列表限制 (${limits.watchlistLimit})。请升级到更高级别的计划以获得更多观察列表。`;
        }
        break;
      case 'emailNotification':
        hasPermission = limits.emailNotifications;
        if (!hasPermission) {
          message = `邮件通知功能仅在 Pro 和 Enterprise 计划中可用。请升级您的计划以使用此功能。`;
        }
        break;
      case 'customAIConfig':
        hasPermission = limits.customAIConfig;
        if (!hasPermission) {
          message = `自定义AI配置功能仅在 Pro 和 Enterprise 计划中可用。请升级您的计划以使用此功能。`;
        }
        break;
      default:
        hasPermission = false;
        message = '未知操作';
    }
    
    if (!hasPermission) {
      throw new Error(message);
    }
  }

  // 增加使用量
  private static async incrementUsage(userId: number, field: 'queriesUsed' | 'aiAnalysisUsed'): Promise<void> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const existingUsage = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.date, todayStr)
      ))
      .limit(1);

    if (existingUsage.length > 0) {
      // 更新现有记录
      await db
        .update(usageTracking)
        .set({
          [field]: (existingUsage[0][field] ?? 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(usageTracking.id, existingUsage[0].id));
    } else {
      // 创建新记录
      await db.insert(usageTracking).values({
        userId,
        date: todayStr,
        [field]: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // 设置使用量
  private static async setUsage(userId: number, field: 'watchlistCount', value: number): Promise<void> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const existingUsage = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.date, todayStr)
      ))
      .limit(1);

    if (existingUsage.length > 0) {
      // 更新现有记录
      await db
        .update(usageTracking)
        .set({
          [field]: value,
          updatedAt: new Date()
        })
        .where(eq(usageTracking.id, existingUsage[0].id));
    } else {
      // 创建新记录
      await db.insert(usageTracking).values({
        userId,
        date: todayStr,
        [field]: value,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // 获取用户使用量历史
  static async getUsageHistory(userId: number, days: number = 30): Promise<Array<{
    date: string;
    queriesUsed: number;
    aiAnalysisUsed: number;
    watchlistCount: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const history = await db
      .select({
        date: usageTracking.date,
        queriesUsed: usageTracking.queriesUsed,
        aiAnalysisUsed: usageTracking.aiAnalysisUsed,
        watchlistCount: usageTracking.watchlistCount
      })
      .from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        gte(usageTracking.date, startDateStr)
      ))
      .orderBy(usageTracking.date);

    // 处理null值
    return history.map(item => ({
      date: item.date,
      queriesUsed: item.queriesUsed ?? 0,
      aiAnalysisUsed: item.aiAnalysisUsed ?? 0,
      watchlistCount: item.watchlistCount ?? 0
    }));
  }

  // 重置每日使用量（定时任务使用）
  static async resetDailyUsage(): Promise<void> {
    // 这个功能通常由定时任务在每天凌晨调用
    // 由于我们使用日期字段，实际上不需要重置，新的一天会自动创建新记录
    console.log('Daily usage reset completed');
  }

  // 获取订阅计划详情
  static getSubscriptionPlans(): Array<{
    id: string;
    name: string;
    tier: SubscriptionTier;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    features: string[];
    limits: any;
  }> {
    return [
      {
        id: 'free',
        name: '免费版',
        tier: SubscriptionTier.FREE,
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '基础股票搜索',
          '价格图表展示',
          '基础技术指标',
          '5个观察列表',
          '每日50次查询',
          '每日10次AI分析'
        ],
        limits: SUBSCRIPTION_LIMITS[SubscriptionTier.FREE]
      },
      {
        id: 'pro',
        name: '专业版',
        tier: SubscriptionTier.PRO,
        price: 29,
        currency: 'USD',
        interval: 'month',
        features: [
          '所有免费版功能',
          '高级技术分析',
          '基本面分析',
          'AI情感分析',
          '自定义AI配置',
          '邮件通知',
          '20个观察列表',
          '每日500次查询',
          '每日100次AI分析'
        ],
        limits: SUBSCRIPTION_LIMITS[SubscriptionTier.PRO]
      },
      {
        id: 'enterprise',
        name: '企业版',
        tier: SubscriptionTier.ENTERPRISE,
        price: 99,
        currency: 'USD',
        interval: 'month',
        features: [
          '所有专业版功能',
          '高级推荐算法',
          '预警监控系统',
          '性能优化和缓存',
          '移动端适配',
          '用户体验优化',
          '100个观察列表',
          '每日5000次查询',
          '每日1000次AI分析',
          '优先技术支持'
        ],
        limits: SUBSCRIPTION_LIMITS[SubscriptionTier.ENTERPRISE]
      }
    ];
  }
}
