export interface TechnicalIndicators {
  sma50?: number;
  sma200?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  bbUpper?: number;
  bbLower?: number;
  obv?: number;
}

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export class TechnicalAnalysisEngine {
  /**
   * 计算简单移动平均线 (SMA)
   */
  calculateSMA(prices: number[], period: number): number[] {
    if (prices.length < period) {
      return [];
    }

    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }

    return sma;
  }

  /**
   * 计算相对强弱指数 (RSI)
   */
  calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) {
      return [];
    }

    const gains: number[] = [];
    const losses: number[] = [];

    // 计算价格变化
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const rsi: number[] = [];
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // 计算第一个RSI值
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    // 计算后续RSI值
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  /**
   * 计算MACD指标
   */
  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    if (prices.length < slowPeriod) {
      return { macd: [], signal: [], histogram: [] };
    }

    // 计算EMA
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    // 计算MACD线
    const macd: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    for (let i = 0; i < fastEMA.length; i++) {
      const fastValue = fastEMA[i];
      const slowValue = slowEMA[i + startIndex];
      macd.push(fastValue - slowValue);
    }

    // 计算信号线
    const signal = this.calculateEMA(macd, signalPeriod);

    // 计算柱状图
    const histogram: number[] = [];
    const signalStartIndex = signalPeriod - 1;
    for (let i = 0; i < signal.length; i++) {
      const macdValue = macd[i + signalStartIndex];
      const signalValue = signal[i];
      histogram.push(macdValue - signalValue);
    }

    return { macd, signal, histogram };
  }

  /**
   * 计算指数移动平均线 (EMA)
   */
  private calculateEMA(prices: number[], period: number): number[] {
    if (prices.length < period) {
      return [];
    }

    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    // 第一个EMA值使用SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);

    // 计算后续EMA值
    for (let i = period; i < prices.length; i++) {
      const newEMA = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(newEMA);
    }

    return ema;
  }

  /**
   * 计算布林带
   */
  calculateBollingerBands(prices: number[], period: number = 20, standardDeviations: number = 2): BollingerBands {
    if (prices.length < period) {
      return { upper: [], middle: [], lower: [] };
    }

    const sma = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const middle = sma;
    const lower: number[] = [];

    for (let i = 0; i < sma.length; i++) {
      const startIndex = i;
      const endIndex = i + period;
      const slice = prices.slice(startIndex, endIndex);
      
      // 计算标准差
      const mean = sma[i];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      upper.push(mean + (standardDeviations * standardDeviation));
      lower.push(mean - (standardDeviations * standardDeviation));
    }

    return { upper, middle, lower };
  }

  /**
   * 计算能量潮指标 (OBV)
   */
  calculateOBV(prices: number[], volumes: number[]): number[] {
    if (prices.length !== volumes.length || prices.length === 0) {
      return [];
    }

    const obv: number[] = [volumes[0]];

    for (let i = 1; i < prices.length; i++) {
      let currentOBV = obv[i - 1];
      
      if (prices[i] > prices[i - 1]) {
        currentOBV += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        currentOBV -= volumes[i];
      }
      // 如果价格相等，OBV保持不变

      obv.push(currentOBV);
    }

    return obv;
  }

  /**
   * 计算技术分析综合评分
   */
  calculateTechnicalScore(indicators: TechnicalIndicators): number {
    let score = 0;
    let totalWeight = 0;

    // SMA 50 vs 200 比较
    if (indicators.sma50 && indicators.sma200) {
      const smaWeight = 0.2;
      totalWeight += smaWeight;
      if (indicators.sma50 > indicators.sma200) {
        score += smaWeight; // 看涨信号
      }
    }

    // RSI 分析
    if (indicators.rsi14) {
      const rsiWeight = 0.2;
      totalWeight += rsiWeight;
      if (indicators.rsi14 > 30 && indicators.rsi14 < 70) {
        score += rsiWeight * 0.5; // 中性
      } else if (indicators.rsi14 <= 30) {
        score += rsiWeight; // 超卖，看涨信号
      }
    }

    // MACD 分析
    if (indicators.macd && indicators.macdSignal) {
      const macdWeight = 0.2;
      totalWeight += macdWeight;
      if (indicators.macd > indicators.macdSignal) {
        score += macdWeight; // 看涨信号
      }
    }

    // 布林带分析
    if (indicators.bbUpper && indicators.bbLower) {
      const bbWeight = 0.2;
      totalWeight += bbWeight;
      // 这里需要当前价格来判断，暂时给中性评分
      score += bbWeight * 0.5;
    }

    // OBV 分析
    if (indicators.obv) {
      const obvWeight = 0.2;
      totalWeight += obvWeight;
      // OBV需要历史数据比较，暂时给中性评分
      score += obvWeight * 0.5;
    }

    return totalWeight > 0 ? score / totalWeight : 0.5;
  }

  /**
   * 获取最新的技术指标
   */
  getLatestIndicators(prices: number[], volumes: number[]): TechnicalIndicators {
    if (prices.length === 0) {
      return {};
    }

    const sma50 = this.calculateSMA(prices, 50);
    const sma200 = this.calculateSMA(prices, 200);
    const rsi14 = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);
    const obv = this.calculateOBV(prices, volumes);

    return {
      sma50: sma50[sma50.length - 1],
      sma200: sma200[sma200.length - 1],
      rsi14: rsi14[rsi14.length - 1],
      macd: macd.macd[macd.macd.length - 1],
      macdSignal: macd.signal[macd.signal.length - 1],
      bbUpper: bb.upper[bb.upper.length - 1],
      bbLower: bb.lower[bb.lower.length - 1],
      obv: obv[obv.length - 1],
    };
  }
}
