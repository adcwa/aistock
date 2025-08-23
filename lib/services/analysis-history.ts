import { db } from '@/lib/db/drizzle';
import { analysisHistory } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export interface AnalysisHistoryData {
  userId: number;
  stockId: number;
  recommendation: string;
  confidence: number;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  macroScore: number;
  overallScore: number;
  reasoning?: string;
  aiSentiment?: string;
  aiConfidence?: number;
  aiReasoning?: string;
  actualPrice?: number;
  predictedPrice?: number;
  accuracy?: number;
}

export interface AccuracyStats {
  totalAnalyses: number;
  correctPredictions: number;
  accuracyRate: number;
  priceAccuracy: number;
  pricePredictionsCount: number;
  averageConfidence: number;
  byRecommendation: {
    buy: { total: number; correct: number; accuracy: number };
    hold: { total: number; correct: number; accuracy: number };
    sell: { total: number; correct: number; accuracy: number };
  };
}

export class AnalysisHistoryService {
  /**
   * 保存分析历史
   */
  async saveAnalysis(data: AnalysisHistoryData): Promise<void> {
    await db.insert(analysisHistory).values({
      userId: data.userId,
      stockId: data.stockId,
      recommendation: data.recommendation,
      confidence: data.confidence.toString(),
      technicalScore: data.technicalScore.toString(),
      fundamentalScore: data.fundamentalScore.toString(),
      sentimentScore: data.sentimentScore.toString(),
      macroScore: data.macroScore.toString(),
      overallScore: data.overallScore.toString(),
      reasoning: data.reasoning,
      aiSentiment: data.aiSentiment,
      aiConfidence: data.aiConfidence?.toString(),
      aiReasoning: data.aiReasoning,
      actualPrice: data.actualPrice?.toString(),
      predictedPrice: data.predictedPrice?.toString(),
      accuracy: data.accuracy?.toString(),
    });
  }

  /**
   * 更新分析历史（添加实际价格和准确率）
   */
  async updateAnalysisWithActualPrice(
    userId: number,
    stockId: number,
    createdAt: Date,
    actualPrice: number,
    predictedPrice?: number
  ): Promise<void> {
    const history = await db
      .select()
      .from(analysisHistory)
      .where(
        and(
          eq(analysisHistory.userId, userId),
          eq(analysisHistory.stockId, stockId),
          eq(analysisHistory.createdAt, createdAt)
        )
      )
      .limit(1);

    if (history.length === 0) return;

    const analysis = history[0];
    const recommendation = analysis.recommendation;
    const confidence = parseFloat(analysis.confidence);

    // 计算准确率（简化版本）
    let accuracy = 0.5; // 默认中性
    if (predictedPrice && actualPrice) {
      const priceAccuracy = 1 - Math.abs(predictedPrice - actualPrice) / actualPrice;
      accuracy = Math.max(0, Math.min(1, priceAccuracy));
    }

    await db
      .update(analysisHistory)
      .set({
        actualPrice: actualPrice.toString(),
        predictedPrice: predictedPrice?.toString(),
        accuracy: accuracy.toString(),
        updatedAt: new Date(),
      })
      .where(eq(analysisHistory.id, analysis.id));
  }

  /**
   * 获取用户的分析历史
   */
  async getUserAnalysisHistory(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ) {
    return await db
      .select()
      .from(analysisHistory)
      .where(eq(analysisHistory.userId, userId))
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 获取特定股票的分析历史
   */
  async getStockAnalysisHistory(
    userId: number,
    stockId: number,
    limit: number = 20
  ) {
    return await db
      .select()
      .from(analysisHistory)
      .where(
        and(
          eq(analysisHistory.userId, userId),
          eq(analysisHistory.stockId, stockId)
        )
      )
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit);
  }

  /**
   * 计算用户的分析准确率统计
   */
  async getAccuracyStats(userId: number, days: number = 30): Promise<AccuracyStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const histories = await db
      .select()
      .from(analysisHistory)
      .where(
        and(
          eq(analysisHistory.userId, userId),
          gte(analysisHistory.createdAt, startDate)
        )
      );

    const totalAnalyses = histories.length;
    
    // 计算价格预测准确率
    const pricePredictions = histories.filter(h => h.predictedPrice && h.actualPrice);
    const priceAccuracy = pricePredictions.length > 0 
      ? pricePredictions.reduce((sum, h) => {
          const predicted = parseFloat(h.predictedPrice!);
          const actual = parseFloat(h.actualPrice!);
          const accuracy = 1 - Math.abs(predicted - actual) / actual;
          return sum + Math.max(0, accuracy);
        }, 0) / pricePredictions.length
      : 0;
    
    // 计算推荐准确率
    const recommendationsWithAccuracy = histories.filter(h => 
      h.accuracy && parseFloat(h.accuracy) >= 0 && parseFloat(h.accuracy) <= 1
    );
    const correctPredictions = recommendationsWithAccuracy.filter(h => parseFloat(h.accuracy) >= 0.6).length;
    const averageConfidence = histories.reduce((sum, h) => sum + parseFloat(h.confidence), 0) / totalAnalyses || 0;

    const byRecommendation = {
      buy: { total: 0, correct: 0, accuracy: 0 },
      hold: { total: 0, correct: 0, accuracy: 0 },
      sell: { total: 0, correct: 0, accuracy: 0 },
    };

    histories.forEach(h => {
      const rec = h.recommendation.toLowerCase();
      if (rec in byRecommendation) {
        byRecommendation[rec as keyof typeof byRecommendation].total++;
        if (parseFloat(h.accuracy) >= 0.6) {
          byRecommendation[rec as keyof typeof byRecommendation].correct++;
        }
      }
    });

    // 计算每种推荐类型的准确率
    Object.keys(byRecommendation).forEach(key => {
      const rec = byRecommendation[key as keyof typeof byRecommendation];
      rec.accuracy = rec.total > 0 ? rec.correct / rec.total : 0;
    });

    return {
      totalAnalyses,
      correctPredictions,
      accuracyRate: totalAnalyses > 0 ? correctPredictions / totalAnalyses : 0,
      priceAccuracy: priceAccuracy,
      pricePredictionsCount: pricePredictions.length,
      averageConfidence,
      byRecommendation,
    };
  }

  /**
   * 获取最佳和最差的分析记录
   */
  async getBestWorstAnalyses(userId: number, limit: number = 5) {
    const [bestAnalyses, worstAnalyses] = await Promise.all([
      db
        .select()
        .from(analysisHistory)
        .where(
          and(
            eq(analysisHistory.userId, userId),
            gte(analysisHistory.accuracy, '0.0')
          )
        )
        .orderBy(desc(analysisHistory.accuracy))
        .limit(limit),
      db
        .select()
        .from(analysisHistory)
        .where(
          and(
            eq(analysisHistory.userId, userId),
            gte(analysisHistory.accuracy, '0.0')
          )
        )
        .orderBy(analysisHistory.accuracy)
        .limit(limit),
    ]);

    return { bestAnalyses, worstAnalyses };
  }
}
