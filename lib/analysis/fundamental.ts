import type { FundamentalData } from '../services/data-sources';

export interface FinancialRatios {
  peRatio?: number;
  pbRatio?: number;
  roe?: number;
  debtToEquity?: number;
  profitMargin?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
}

export interface ComparisonResult {
  peRatioPercentile?: number;
  pbRatioPercentile?: number;
  roePercentile?: number;
  industryAverage?: FinancialRatios;
  sectorAverage?: FinancialRatios;
}

export class FundamentalAnalysisEngine {
  /**
   * 计算财务比率
   */
  calculateFinancialRatios(fundamentals: FundamentalData[]): FinancialRatios {
    if (fundamentals.length === 0) {
      return {};
    }

    // 获取最新的财务数据
    const latest = fundamentals.sort((a, b) => 
      b.reportDate.getTime() - a.reportDate.getTime()
    )[0];

    // 获取前一年的数据用于计算增长率
    const previousYear = fundamentals.find(f => 
      f.year === latest.year - 1 && f.quarter === latest.quarter
    );

    const ratios: FinancialRatios = {};

    // 计算P/E比率
    if (latest.eps && latest.eps > 0) {
      // 这里需要当前股价，暂时使用占位符
      const currentPrice = 100; // 需要从外部传入
      const peRatio = currentPrice / latest.eps;
      if (!isNaN(peRatio)) {
        ratios.peRatio = peRatio;
      }
    }

    // 计算P/B比率
    if (latest.pb) {
      ratios.pbRatio = latest.pb;
    }

    // 计算ROE
    if (latest.roe) {
      ratios.roe = latest.roe;
    }

    // 计算债务权益比
    if (latest.debtToEquity) {
      ratios.debtToEquity = latest.debtToEquity;
    }

    // 计算利润率
    if (latest.revenue && latest.netIncome && latest.revenue > 0) {
      const profitMargin = (latest.netIncome / latest.revenue) * 100;
      if (!isNaN(profitMargin)) {
        ratios.profitMargin = profitMargin;
      }
    }

    // 计算收入增长率
    if (previousYear && latest.revenue && previousYear.revenue && previousYear.revenue > 0) {
      const revenueGrowth = ((latest.revenue - previousYear.revenue) / previousYear.revenue) * 100;
      if (!isNaN(revenueGrowth)) {
        ratios.revenueGrowth = revenueGrowth;
      }
    }

    // 计算盈利增长率
    if (previousYear && latest.netIncome && previousYear.netIncome && previousYear.netIncome !== 0) {
      const earningsGrowth = ((latest.netIncome - previousYear.netIncome) / previousYear.netIncome) * 100;
      if (!isNaN(earningsGrowth)) {
        ratios.earningsGrowth = earningsGrowth;
      }
    }

    return ratios;
  }

  /**
   * 与行业平均水平比较
   */
  async compareWithIndustry(symbol: string, ratios: FinancialRatios): Promise<ComparisonResult> {
    // 这里应该从数据库或外部API获取行业数据
    // 暂时返回模拟数据
    const industryAverages: FinancialRatios = {
      peRatio: 15.5,
      pbRatio: 2.1,
      roe: 12.5,
      debtToEquity: 0.6,
      profitMargin: 8.2,
      revenueGrowth: 5.8,
      earningsGrowth: 6.2,
    };

    const result: ComparisonResult = {
      industryAverage: industryAverages,
    };

    // 计算百分位数
    if (ratios.peRatio && industryAverages.peRatio) {
      result.peRatioPercentile = this.calculatePercentile(ratios.peRatio, industryAverages.peRatio);
    }

    if (ratios.pbRatio && industryAverages.pbRatio) {
      result.pbRatioPercentile = this.calculatePercentile(ratios.pbRatio, industryAverages.pbRatio);
    }

    if (ratios.roe && industryAverages.roe) {
      result.roePercentile = this.calculatePercentile(ratios.roe, industryAverages.roe);
    }

    return result;
  }

  /**
   * 计算基本面综合评分
   */
  calculateFundamentalScore(ratios: FinancialRatios, comparison?: ComparisonResult): number {
    let score = 0;
    let totalWeight = 0;

    // P/E比率评分 (权重: 0.15)
    if (ratios.peRatio) {
      const peWeight = 0.15;
      totalWeight += peWeight;
      
      if (ratios.peRatio < 10) {
        score += peWeight; // 低P/E，看涨
      } else if (ratios.peRatio < 20) {
        score += peWeight * 0.7; // 合理P/E
      } else if (ratios.peRatio < 30) {
        score += peWeight * 0.4; // 较高P/E
      } else {
        score += peWeight * 0.1; // 高P/E，看跌
      }
    }

    // P/B比率评分 (权重: 0.10)
    if (ratios.pbRatio) {
      const pbWeight = 0.10;
      totalWeight += pbWeight;
      
      if (ratios.pbRatio < 1) {
        score += pbWeight; // 低P/B，看涨
      } else if (ratios.pbRatio < 3) {
        score += pbWeight * 0.7; // 合理P/B
      } else {
        score += pbWeight * 0.3; // 高P/B
      }
    }

    // ROE评分 (权重: 0.20)
    if (ratios.roe) {
      const roeWeight = 0.20;
      totalWeight += roeWeight;
      
      if (ratios.roe > 15) {
        score += roeWeight; // 高ROE，看涨
      } else if (ratios.roe > 10) {
        score += roeWeight * 0.8; // 良好ROE
      } else if (ratios.roe > 5) {
        score += roeWeight * 0.5; // 一般ROE
      } else {
        score += roeWeight * 0.2; // 低ROE
      }
    }

    // 债务权益比评分 (权重: 0.10)
    if (ratios.debtToEquity) {
      const debtWeight = 0.10;
      totalWeight += debtWeight;
      
      if (ratios.debtToEquity < 0.3) {
        score += debtWeight; // 低债务，看涨
      } else if (ratios.debtToEquity < 0.7) {
        score += debtWeight * 0.7; // 合理债务
      } else {
        score += debtWeight * 0.3; // 高债务
      }
    }

    // 利润率评分 (权重: 0.15)
    if (ratios.profitMargin) {
      const marginWeight = 0.15;
      totalWeight += marginWeight;
      
      if (ratios.profitMargin > 15) {
        score += marginWeight; // 高利润率
      } else if (ratios.profitMargin > 8) {
        score += marginWeight * 0.8; // 良好利润率
      } else if (ratios.profitMargin > 0) {
        score += marginWeight * 0.5; // 正利润率
      } else {
        score += marginWeight * 0.1; // 负利润率
      }
    }

    // 收入增长率评分 (权重: 0.15)
    if (ratios.revenueGrowth) {
      const growthWeight = 0.15;
      totalWeight += growthWeight;
      
      if (ratios.revenueGrowth > 20) {
        score += growthWeight; // 高增长
      } else if (ratios.revenueGrowth > 10) {
        score += growthWeight * 0.9; // 良好增长
      } else if (ratios.revenueGrowth > 0) {
        score += growthWeight * 0.6; // 正增长
      } else {
        score += growthWeight * 0.2; // 负增长
      }
    }

    // 盈利增长率评分 (权重: 0.15)
    if (ratios.earningsGrowth) {
      const earningsWeight = 0.15;
      totalWeight += earningsWeight;
      
      if (ratios.earningsGrowth > 25) {
        score += earningsWeight; // 高增长
      } else if (ratios.earningsGrowth > 15) {
        score += earningsWeight * 0.9; // 良好增长
      } else if (ratios.earningsGrowth > 0) {
        score += earningsWeight * 0.6; // 正增长
      } else {
        score += earningsWeight * 0.2; // 负增长
      }
    }

    // 行业比较调整
    if (comparison) {
      const adjustment = this.calculateIndustryAdjustment(comparison);
      score += adjustment;
    }

    return totalWeight > 0 ? Math.max(0, Math.min(1, score / totalWeight)) : 0.5;
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(value: number, average: number): number {
    // 简化的百分位数计算
    if (value <= average) {
      return 50 - ((average - value) / average) * 25;
    } else {
      return 50 + ((value - average) / average) * 25;
    }
  }

  /**
   * 计算行业比较调整
   */
  private calculateIndustryAdjustment(comparison: ComparisonResult): number {
    let adjustment = 0;

    // P/E比率调整
    if (comparison.peRatioPercentile) {
      if (comparison.peRatioPercentile < 25) {
        adjustment += 0.05; // 优于行业75%的公司
      } else if (comparison.peRatioPercentile > 75) {
        adjustment -= 0.05; // 劣于行业75%的公司
      }
    }

    // ROE调整
    if (comparison.roePercentile) {
      if (comparison.roePercentile > 75) {
        adjustment += 0.05; // 优于行业75%的公司
      } else if (comparison.roePercentile < 25) {
        adjustment -= 0.05; // 劣于行业75%的公司
      }
    }

    return adjustment;
  }

  /**
   * 获取基本面分析摘要
   */
  getFundamentalSummary(ratios: FinancialRatios): string {
    const summary: string[] = [];

    if (ratios.peRatio) {
      if (ratios.peRatio < 15) {
        summary.push('P/E比率较低，估值相对合理');
      } else if (ratios.peRatio > 25) {
        summary.push('P/E比率较高，估值偏高');
      } else {
        summary.push('P/E比率处于合理区间');
      }
    }

    if (ratios.roe) {
      if (ratios.roe > 15) {
        summary.push('ROE表现优秀，资本回报率高');
      } else if (ratios.roe < 8) {
        summary.push('ROE偏低，资本回报率有待提升');
      } else {
        summary.push('ROE表现良好');
      }
    }

    if (ratios.revenueGrowth) {
      if (ratios.revenueGrowth > 15) {
        summary.push('收入增长强劲');
      } else if (ratios.revenueGrowth < 0) {
        summary.push('收入出现下滑');
      } else {
        summary.push('收入保持稳定增长');
      }
    }

    if (ratios.debtToEquity) {
      if (ratios.debtToEquity > 1) {
        summary.push('债务水平较高，需关注财务风险');
      } else if (ratios.debtToEquity < 0.3) {
        summary.push('债务水平较低，财务结构稳健');
      } else {
        summary.push('债务水平适中');
      }
    }

    return summary.length > 0 ? summary.join('；') : '基本面数据不足，无法提供详细分析';
  }
}
