export interface AnalysisScores {
  technical: number;
  fundamental: number;
  sentiment: number;
  macro: number;
}

export interface OverallScore {
  score: number;
  confidence: number;
  breakdown: AnalysisScores;
}

export interface RecommendationResult {
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  reasoning: string;
  scores: AnalysisScores;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
}

export class RecommendationEngine {
  private readonly WEIGHTS = {
    technical: 0.25,
    fundamental: 0.35,
    sentiment: 0.20,
    macro: 0.20,
  };

  /**
   * 计算综合评分
   */
  calculateOverallScore(scores: AnalysisScores): OverallScore {
    const weightedScore = 
      scores.technical * this.WEIGHTS.technical +
      scores.fundamental * this.WEIGHTS.fundamental +
      scores.sentiment * this.WEIGHTS.sentiment +
      scores.macro * this.WEIGHTS.macro;

    // 计算置信度（基于各分析维度的数据完整性）
    const confidence = this.calculateConfidence(scores);

    return {
      score: weightedScore,
      confidence,
      breakdown: scores,
    };
  }

  /**
   * 生成投资建议
   */
  generateRecommendation(overallScore: OverallScore): RecommendationResult {
    const { score, confidence, breakdown } = overallScore;

    let recommendation: RecommendationResult['recommendation'];
    let riskLevel: RecommendationResult['riskLevel'];
    let timeHorizon: RecommendationResult['timeHorizon'];

    // 根据综合评分确定建议
    if (score >= 0.8) {
      recommendation = 'strong_buy';
    } else if (score >= 0.6) {
      recommendation = 'buy';
    } else if (score >= 0.4) {
      recommendation = 'hold';
    } else if (score >= 0.2) {
      recommendation = 'sell';
    } else {
      recommendation = 'strong_sell';
    }

    // 确定风险等级
    if (confidence >= 0.8 && Math.abs(breakdown.technical - breakdown.fundamental) < 0.2) {
      riskLevel = 'low';
    } else if (confidence >= 0.6) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    // 确定时间周期
    if (breakdown.technical > 0.7 && breakdown.sentiment > 0.6) {
      timeHorizon = 'short';
    } else if (breakdown.fundamental > 0.7) {
      timeHorizon = 'long';
    } else {
      timeHorizon = 'medium';
    }

    const reasoning = this.generateReasoning(breakdown, recommendation);

    return {
      recommendation,
      confidence,
      reasoning,
      scores: breakdown,
      riskLevel,
      timeHorizon,
    };
  }

  /**
   * 生成推理说明
   */
  generateReasoning(scores: AnalysisScores, recommendation: string): string {
    const reasons: string[] = [];

    // 技术分析推理
    if (scores.technical > 0.7) {
      reasons.push('技术指标显示强劲的上涨趋势');
    } else if (scores.technical > 0.5) {
      reasons.push('技术指标呈现中性偏乐观信号');
    } else if (scores.technical < 0.3) {
      reasons.push('技术指标显示下跌趋势');
    } else {
      reasons.push('技术指标信号不明确');
    }

    // 基本面分析推理
    if (scores.fundamental > 0.7) {
      reasons.push('基本面表现优秀，财务状况健康');
    } else if (scores.fundamental > 0.5) {
      reasons.push('基本面表现良好，具有投资价值');
    } else if (scores.fundamental < 0.3) {
      reasons.push('基本面存在风险，需谨慎考虑');
    } else {
      reasons.push('基本面数据有限，建议进一步分析');
    }

    // 情感分析推理
    if (scores.sentiment > 0.7) {
      reasons.push('市场情绪积极，投资者信心较强');
    } else if (scores.sentiment > 0.5) {
      reasons.push('市场情绪相对乐观');
    } else if (scores.sentiment < 0.3) {
      reasons.push('市场情绪低迷，投资者信心不足');
    } else {
      reasons.push('市场情绪中性');
    }

    // 宏观经济推理
    if (scores.macro > 0.7) {
      reasons.push('宏观经济环境有利');
    } else if (scores.macro > 0.5) {
      reasons.push('宏观经济环境相对稳定');
    } else if (scores.macro < 0.3) {
      reasons.push('宏观经济环境存在不确定性');
    } else {
      reasons.push('宏观经济影响中性');
    }

    // 根据建议类型调整语气
    let conclusion = '';
    switch (recommendation) {
      case 'strong_buy':
        conclusion = '综合各方面分析，强烈建议买入';
        break;
      case 'buy':
        conclusion = '综合各方面分析，建议买入';
        break;
      case 'hold':
        conclusion = '综合各方面分析，建议持有观望';
        break;
      case 'sell':
        conclusion = '综合各方面分析，建议卖出';
        break;
      case 'strong_sell':
        conclusion = '综合各方面分析，强烈建议卖出';
        break;
    }

    return `${reasons.join('；')}。${conclusion}。`;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(scores: AnalysisScores): number {
    const validScores = Object.values(scores).filter(score => score > 0);
    
    if (validScores.length === 0) {
      return 0;
    }

    // 基于有效数据数量和一致性计算置信度
    const dataCompleteness = validScores.length / 4;
    const consistency = 1 - this.calculateVariance(validScores);
    
    return (dataCompleteness * 0.6 + consistency * 0.4);
  }

  /**
   * 计算方差（用于评估一致性）
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    
    return variance;
  }

  /**
   * 获取建议摘要
   */
  getRecommendationSummary(result: RecommendationResult): string {
    const { recommendation, confidence, riskLevel, timeHorizon } = result;
    
    const recommendationText = {
      strong_buy: '强烈买入',
      buy: '买入',
      hold: '持有',
      sell: '卖出',
      strong_sell: '强烈卖出',
    };

    const riskText = {
      low: '低风险',
      medium: '中等风险',
      high: '高风险',
    };

    const horizonText = {
      short: '短期',
      medium: '中期',
      long: '长期',
    };

    return `${recommendationText[recommendation]}建议，置信度${(confidence * 100).toFixed(0)}%，${riskText[riskLevel]}，适合${horizonText[timeHorizon]}投资。`;
  }

  /**
   * 获取风险提示
   */
  getRiskWarning(result: RecommendationResult): string {
    const warnings: string[] = [];

    if (result.confidence < 0.6) {
      warnings.push('数据置信度较低，建议谨慎决策');
    }

    if (result.riskLevel === 'high') {
      warnings.push('投资风险较高，请充分评估个人风险承受能力');
    }

    if (Math.abs(result.scores.technical - result.scores.fundamental) > 0.3) {
      warnings.push('技术面与基本面分析结果差异较大，建议进一步研究');
    }

    if (result.scores.sentiment < 0.3) {
      warnings.push('市场情绪低迷，可能存在系统性风险');
    }

    return warnings.length > 0 ? warnings.join('；') : '风险提示：投资有风险，入市需谨慎。';
  }
}
