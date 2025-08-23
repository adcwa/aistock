import { TechnicalIndicators, FinancialRatios } from '@/lib/data-sources/data-sources';

export interface PricePredictionInput {
  currentPrice: number;
  technicalIndicators: TechnicalIndicators;
  financialRatios: FinancialRatios;
  recommendation: string;
  confidence: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
}

export interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  timeFrame: '1d' | '1w' | '1m' | '3m';
  reasoning: string;
  riskFactors: string[];
}

export class PricePredictionService {
  /**
   * 基于技术指标和基本面数据预测价格
   */
  predictPrice(input: PricePredictionInput): PricePrediction {
    const { currentPrice, technicalIndicators, financialRatios, recommendation, confidence, marketTrend } = input;
    
    // 基础价格变化率
    let baseChangePercent = 0;
    
    // 根据推荐调整基础变化率
    switch (recommendation.toLowerCase()) {
      case 'buy':
        baseChangePercent = 0.05; // 5% 上涨
        break;
      case 'sell':
        baseChangePercent = -0.05; // 5% 下跌
        break;
      case 'hold':
        baseChangePercent = 0.01; // 1% 小幅上涨
        break;
      default:
        baseChangePercent = 0;
    }
    
    // 技术指标调整
    let technicalAdjustment = 0;
    
    // RSI调整
    if (technicalIndicators.rsi) {
      if (technicalIndicators.rsi < 30) {
        technicalAdjustment += 0.03; // 超卖，可能反弹
      } else if (technicalIndicators.rsi > 70) {
        technicalAdjustment -= 0.03; // 超买，可能回调
      }
    }
    
    // MACD调整
    if (technicalIndicators.macd && technicalIndicators.macdSignal) {
      const macdDiff = technicalIndicators.macd - technicalIndicators.macdSignal;
      if (macdDiff > 0) {
        technicalAdjustment += 0.02; // MACD金叉
      } else {
        technicalAdjustment -= 0.02; // MACD死叉
      }
    }
    
    // 布林带调整
    if (technicalIndicators.bollingerBands) {
      const { upper, lower, middle } = technicalIndicators.bollingerBands;
      const currentPrice = input.currentPrice;
      
      if (currentPrice < lower) {
        technicalAdjustment += 0.04; // 接近下轨，可能反弹
      } else if (currentPrice > upper) {
        technicalAdjustment -= 0.04; // 接近上轨，可能回调
      }
    }
    
    // 基本面调整
    let fundamentalAdjustment = 0;
    
    // P/E比率调整
    if (financialRatios.peRatio) {
      if (financialRatios.peRatio < 15) {
        fundamentalAdjustment += 0.02; // 低P/E，可能被低估
      } else if (financialRatios.peRatio > 25) {
        fundamentalAdjustment -= 0.02; // 高P/E，可能被高估
      }
    }
    
    // 盈利增长调整
    if (financialRatios.earningsGrowth) {
      if (financialRatios.earningsGrowth > 10) {
        fundamentalAdjustment += 0.03; // 高盈利增长
      } else if (financialRatios.earningsGrowth < -5) {
        fundamentalAdjustment -= 0.03; // 盈利下降
      }
    }
    
    // 市场趋势调整
    let marketAdjustment = 0;
    switch (marketTrend) {
      case 'bullish':
        marketAdjustment = 0.02;
        break;
      case 'bearish':
        marketAdjustment = -0.02;
        break;
      default:
        marketAdjustment = 0;
    }
    
    // 计算总变化率
    const totalChangePercent = baseChangePercent + technicalAdjustment + fundamentalAdjustment + marketAdjustment;
    
    // 应用置信度调整
    const confidenceAdjustedChange = totalChangePercent * (confidence / 100);
    
    // 计算预测价格
    const predictedPrice = currentPrice * (1 + confidenceAdjustedChange);
    
    // 生成推理说明
    const reasoning = this.generateReasoning({
      baseChangePercent,
      technicalAdjustment,
      fundamentalAdjustment,
      marketAdjustment,
      recommendation,
      technicalIndicators,
      financialRatios,
    });
    
    // 识别风险因素
    const riskFactors = this.identifyRiskFactors({
      technicalIndicators,
      financialRatios,
      confidence,
      marketTrend,
    });
    
    return {
      predictedPrice: Math.round(predictedPrice * 100) / 100, // 保留两位小数
      confidence: Math.min(confidence, 95), // 最大95%置信度
      timeFrame: '1w', // 默认一周预测
      reasoning,
      riskFactors,
    };
  }
  
  /**
   * 生成预测推理说明
   */
  private generateReasoning(input: {
    baseChangePercent: number;
    technicalAdjustment: number;
    fundamentalAdjustment: number;
    marketAdjustment: number;
    recommendation: string;
    technicalIndicators: TechnicalIndicators;
    financialRatios: FinancialRatios;
  }): string {
    const { baseChangePercent, technicalAdjustment, fundamentalAdjustment, marketAdjustment, recommendation, technicalIndicators, financialRatios } = input;
    
    const reasons: string[] = [];
    
    // 基础推荐
    reasons.push(`基于${recommendation.toUpperCase()}推荐，预期${baseChangePercent > 0 ? '上涨' : '下跌'}${Math.abs(baseChangePercent * 100).toFixed(1)}%`);
    
    // 技术指标
    if (technicalAdjustment !== 0) {
      reasons.push(`技术指标显示${technicalAdjustment > 0 ? '积极' : '消极'}信号，调整${technicalAdjustment > 0 ? '+' : ''}${(technicalAdjustment * 100).toFixed(1)}%`);
    }
    
    // 基本面
    if (fundamentalAdjustment !== 0) {
      reasons.push(`基本面分析${fundamentalAdjustment > 0 ? '支持' : '不支持'}当前价格，调整${fundamentalAdjustment > 0 ? '+' : ''}${(fundamentalAdjustment * 100).toFixed(1)}%`);
    }
    
    // 市场趋势
    if (marketAdjustment !== 0) {
      reasons.push(`市场趋势${marketAdjustment > 0 ? '有利' : '不利'}，调整${marketAdjustment > 0 ? '+' : ''}${(marketAdjustment * 100).toFixed(1)}%`);
    }
    
    return reasons.join('。') + '。';
  }
  
  /**
   * 识别风险因素
   */
  private identifyRiskFactors(input: {
    technicalIndicators: TechnicalIndicators;
    financialRatios: FinancialRatios;
    confidence: number;
    marketTrend: string;
  }): string[] {
    const { technicalIndicators, financialRatios, confidence, marketTrend } = input;
    const risks: string[] = [];
    
    // 置信度风险
    if (confidence < 60) {
      risks.push('预测置信度较低，建议谨慎参考');
    }
    
    // 技术指标风险
    if (technicalIndicators.rsi && technicalIndicators.rsi > 80) {
      risks.push('RSI显示严重超买，存在回调风险');
    }
    if (technicalIndicators.rsi && technicalIndicators.rsi < 20) {
      risks.push('RSI显示严重超卖，但可能存在继续下跌风险');
    }
    
    // 基本面风险
    if (financialRatios.peRatio && financialRatios.peRatio > 30) {
      risks.push('P/E比率过高，存在估值风险');
    }
    if (financialRatios.debtToEquity && financialRatios.debtToEquity > 1) {
      risks.push('负债率较高，存在财务风险');
    }
    
    // 市场趋势风险
    if (marketTrend === 'bearish') {
      risks.push('整体市场趋势看跌，可能影响个股表现');
    }
    
    return risks;
  }
  
  /**
   * 计算价格预测的准确率
   */
  calculateAccuracy(predictedPrice: number, actualPrice: number): number {
    const error = Math.abs(predictedPrice - actualPrice) / actualPrice;
    return Math.max(0, 1 - error);
  }
}
