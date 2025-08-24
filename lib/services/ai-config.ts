import { db } from '@/lib/db/drizzle';
import { aiConfigs, aiConfigUsage } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { EncryptionService } from '@/lib/utils/encryption';
import type { AIConfig, NewAIConfig, AIConfigUsage } from '@/lib/db/schema';

// 系统默认AI配置
export const SYSTEM_DEFAULT_CONFIG = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  maxTokens: 1000,
  temperature: 0.3,
  systemPrompt: `你是一个专业的股票分析师，擅长技术分析和基本面分析。
请基于提供的数据进行客观、专业的股票分析，给出明确的投资建议。
分析时请考虑：
1. 技术指标的趋势和信号
2. 基本面数据的健康状况
3. 市场情绪和新闻影响
4. 风险评估和潜在机会
5. 具体的投资建议和理由`,
  analysisPrompt: `请分析以下股票数据并提供投资建议：

股票代码：{{symbol}}
当前价格：{{currentPrice}}

技术指标：
{{technicalIndicators}}

基本面数据：
{{fundamentalData}}

市场背景：
{{marketContext}}

新闻情绪：
{{newsSentiment}}

请提供：
1. 技术分析（趋势、支撑阻力位、技术信号）
2. 基本面分析（估值、财务健康、增长前景）
3. 市场情绪分析（新闻影响、投资者情绪）
4. 风险评估（主要风险因素）
5. 投资建议（买入/持有/卖出，目标价格，时间框架）
6. 关键因素总结（影响股价的主要因素）`
};

export interface AIConfigWithUsage extends AIConfig {
  usageCount: number;
  lastUsed?: Date;
}

export class AIConfigService {
  // 获取用户的所有AI配置
  static async getUserConfigs(userId: number): Promise<AIConfigWithUsage[]> {
    try {
      const configs = await db
        .select()
        .from(aiConfigs)
        .where(eq(aiConfigs.userId, userId))
        .orderBy(desc(aiConfigs.updatedAt));

      // 获取每个配置的使用统计
      const configsWithUsage = await Promise.all(
        configs.map(async (config) => {
          const usage = await db
            .select({
              count: aiConfigUsage.id,
              lastUsed: aiConfigUsage.createdAt
            })
            .from(aiConfigUsage)
            .where(eq(aiConfigUsage.configId, config.id))
            .orderBy(desc(aiConfigUsage.createdAt))
            .limit(1);

          return {
            ...config,
            usageCount: usage.length > 0 ? usage[0].count : 0,
            lastUsed: usage.length > 0 ? usage[0].lastUsed : undefined
          };
        })
      );

      return configsWithUsage;
    } catch (error) {
      console.error('Error getting user configs:', error);
      // 如果表不存在，返回空数组
      return [];
    }
  }

  // 获取用户的默认配置
  static async getDefaultConfig(userId: number): Promise<AIConfig | null> {
    try {
      const config = await db
        .select()
        .from(aiConfigs)
        .where(and(eq(aiConfigs.userId, userId), eq(aiConfigs.isDefault, true)))
        .limit(1);

      return config.length > 0 ? config[0] : null;
    } catch (error) {
      console.error('Error getting default config:', error);
      return null;
    }
  }

  // 获取用户的有效配置（个人配置优先，无配置时使用系统默认）
  static async getEffectiveConfig(userId: number): Promise<AIConfig> {
    const userConfig = await this.getDefaultConfig(userId);
    
    if (userConfig && userConfig.isActive) {
      return {
        ...userConfig,
        apiKey: userConfig.apiKey ? EncryptionService.decrypt(userConfig.apiKey) : null
      };
    }

    // 返回系统默认配置
    return {
      id: 0,
      userId,
      name: 'System Default',
      isDefault: false,
      baseUrl: SYSTEM_DEFAULT_CONFIG.baseUrl,
      apiKey: process.env.OPENAI_API_KEY || null,
      model: SYSTEM_DEFAULT_CONFIG.model,
      maxTokens: SYSTEM_DEFAULT_CONFIG.maxTokens,
      temperature: SYSTEM_DEFAULT_CONFIG.temperature.toString(),
      systemPrompt: SYSTEM_DEFAULT_CONFIG.systemPrompt,
      analysisPrompt: SYSTEM_DEFAULT_CONFIG.analysisPrompt,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // 创建新的AI配置
  static async createConfig(userId: number, configData: Omit<NewAIConfig, 'userId' | 'createdAt' | 'updatedAt'>): Promise<AIConfig> {
    // 如果设置为默认配置，先取消其他默认配置
    if (configData.isDefault) {
      await db
        .update(aiConfigs)
        .set({ isDefault: false })
        .where(and(eq(aiConfigs.userId, userId), eq(aiConfigs.isDefault, true)));
    }

    // 加密API密钥
    const encryptedApiKey = configData.apiKey ? EncryptionService.encrypt(configData.apiKey) : null;

    const [newConfig] = await db
      .insert(aiConfigs)
      .values({
        ...configData,
        userId,
        apiKey: encryptedApiKey,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return newConfig;
  }

  // 更新AI配置
  static async updateConfig(userId: number, configId: number, configData: Partial<NewAIConfig>): Promise<AIConfig> {
    // 验证配置所有权
    const existingConfig = await db
      .select()
      .from(aiConfigs)
      .where(and(eq(aiConfigs.id, configId), eq(aiConfigs.userId, userId)))
      .limit(1);

    if (existingConfig.length === 0) {
      throw new Error('AI配置不存在或无权限访问');
    }

    // 如果设置为默认配置，先取消其他默认配置
    if (configData.isDefault) {
      await db
        .update(aiConfigs)
        .set({ isDefault: false })
        .where(and(eq(aiConfigs.userId, userId), eq(aiConfigs.isDefault, true)));
    }

    // 如果更新了API密钥，需要加密
    const updateData: any = {
      ...configData,
      updatedAt: new Date()
    };

    if (configData.apiKey !== undefined) {
      updateData.apiKey = configData.apiKey ? EncryptionService.encrypt(configData.apiKey) : null;
    }

    const [updatedConfig] = await db
      .update(aiConfigs)
      .set(updateData)
      .where(eq(aiConfigs.id, configId))
      .returning();

    return updatedConfig;
  }

  // 删除AI配置
  static async deleteConfig(userId: number, configId: number): Promise<void> {
    const result = await db
      .delete(aiConfigs)
      .where(and(eq(aiConfigs.id, configId), eq(aiConfigs.userId, userId)));

    if (result.length === 0) {
      throw new Error('AI配置不存在或无权限删除');
    }
  }

  // 设置默认配置
  static async setDefaultConfig(userId: number, configId: number): Promise<void> {
    // 验证配置所有权
    const existingConfig = await db
      .select()
      .from(aiConfigs)
      .where(and(eq(aiConfigs.id, configId), eq(aiConfigs.userId, userId)))
      .limit(1);

    if (existingConfig.length === 0) {
      throw new Error('AI配置不存在或无权限访问');
    }

    // 取消其他默认配置
    await db
      .update(aiConfigs)
      .set({ isDefault: false })
      .where(and(eq(aiConfigs.userId, userId), eq(aiConfigs.isDefault, true)));

    // 设置新的默认配置
    await db
      .update(aiConfigs)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(aiConfigs.id, configId));
  }

  // 记录配置使用情况
  static async recordUsage(usageData: Omit<AIConfigUsage, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(aiConfigUsage).values({
      ...usageData,
      createdAt: new Date()
    });
  }

  // 获取配置使用统计
  static async getUsageStats(userId: number, configId?: number): Promise<{
    totalUsage: number;
    successRate: number;
    averageResponseTime: number;
    totalCost: number;
  }> {
    const whereClause = configId 
      ? and(eq(aiConfigUsage.userId, userId), eq(aiConfigUsage.configId, configId))
      : eq(aiConfigUsage.userId, userId);

    const usage = await db
      .select({
        success: aiConfigUsage.success,
        responseTime: aiConfigUsage.responseTime,
        cost: aiConfigUsage.cost
      })
      .from(aiConfigUsage)
      .where(whereClause);

    const totalUsage = usage.length;
    const successfulUsage = usage.filter(u => u.success).length;
    const successRate = totalUsage > 0 ? (successfulUsage / totalUsage) * 100 : 0;
    
    const responseTimes = usage.filter(u => u.responseTime !== null).map(u => u.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const costs = usage.filter(u => u.cost !== null).map(u => Number(u.cost));
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);

    return {
      totalUsage,
      successRate,
      averageResponseTime,
      totalCost
    };
  }
}
