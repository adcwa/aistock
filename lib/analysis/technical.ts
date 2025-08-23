export interface TechnicalIndicators {
  sma50?: number;
  sma200?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  obv?: number;
  stochK?: number;
  stochD?: number;
  williamsR?: number;
  atr?: number;
  adx?: number;
  cci?: number;
  mfi?: number;
  ema12?: number;
  ema26?: number;
}

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface StochasticData {
  k: number[];
  d: number[];
}

export interface MACDData {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface PriceData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
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
   * 计算指数移动平均线 (EMA)
   */
  calculateEMA(prices: number[], period: number): number[] {
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
  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDData {
    if (prices.length < slowPeriod) {
      return { macd: [], signal: [], histogram: [] };
    }

    // 计算EMA
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    // 计算MACD线
    const macd: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    for (let i = 0; i < slowEMA.length; i++) {
      macd.push(fastEMA[i + startIndex] - slowEMA[i]);
    }

    // 计算信号线
    const signal = this.calculateEMA(macd, signalPeriod);

    // 计算柱状图
    const histogram: number[] = [];
    for (let i = 0; i < signal.length; i++) {
      histogram.push(macd[i + signalPeriod - 1] - signal[i]);
    }

    return { macd, signal, histogram };
  }

  /**
   * 计算布林带
   */
  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): BollingerBands {
    if (prices.length < period) {
      return { upper: [], middle: [], lower: [] };
    }

    const upper: number[] = [];
    const middle: number[] = [];
    const lower: number[] = [];

    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / period;
      
      // 计算标准差
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      middle.push(sma);
      upper.push(sma + (standardDeviation * stdDev));
      lower.push(sma - (standardDeviation * stdDev));
    }

    return { upper, middle, lower };
  }

  /**
   * 计算随机指标 (Stochastic Oscillator)
   */
  calculateStochastic(high: number[], low: number[], close: number[], kPeriod: number = 14, dPeriod: number = 3): StochasticData {
    if (high.length < kPeriod) {
      return { k: [], d: [] };
    }

    const k: number[] = [];
    
    for (let i = kPeriod - 1; i < high.length; i++) {
      const highestHigh = Math.max(...high.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...low.slice(i - kPeriod + 1, i + 1));
      const currentClose = close[i];
      
      const kValue = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      k.push(kValue);
    }

    // 计算%D (K的SMA)
    const d = this.calculateSMA(k, dPeriod);

    return { k, d };
  }

  /**
   * 计算威廉指标 (Williams %R)
   */
  calculateWilliamsR(high: number[], low: number[], close: number[], period: number = 14): number[] {
    if (high.length < period) {
      return [];
    }

    const williamsR: number[] = [];

    for (let i = period - 1; i < high.length; i++) {
      const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
      const currentClose = close[i];
      
      const rValue = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
      williamsR.push(rValue);
    }

    return williamsR;
  }

  /**
   * 计算平均真实波幅 (ATR)
   */
  calculateATR(high: number[], low: number[], close: number[], period: number = 14): number[] {
    if (high.length < period + 1) {
      return [];
    }

    const trueRanges: number[] = [];

    // 计算真实波幅
    for (let i = 1; i < high.length; i++) {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i - 1]);
      const tr3 = Math.abs(low[i] - close[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // 计算ATR (使用EMA)
    return this.calculateEMA(trueRanges, period);
  }

  /**
   * 计算商品通道指数 (CCI)
   */
  calculateCCI(high: number[], low: number[], close: number[], period: number = 20): number[] {
    if (high.length < period) {
      return [];
    }

    const cci: number[] = [];

    for (let i = period - 1; i < high.length; i++) {
      const slice = close.slice(i - period + 1, i + 1);
      const typicalPrices = slice.map((_, index) => {
        const idx = i - period + 1 + index;
        return (high[idx] + low[idx] + close[idx]) / 3;
      });

      const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
      const meanDeviation = typicalPrices.reduce((sum, price) => sum + Math.abs(price - sma), 0) / period;
      
      const currentTypicalPrice = (high[i] + low[i] + close[i]) / 3;
      const cciValue = meanDeviation === 0 ? 0 : (currentTypicalPrice - sma) / (0.015 * meanDeviation);
      
      cci.push(cciValue);
    }

    return cci;
  }

  /**
   * 计算资金流量指数 (MFI)
   */
  calculateMFI(high: number[], low: number[], close: number[], volume: number[], period: number = 14): number[] {
    if (high.length < period + 1) {
      return [];
    }

    const mfi: number[] = [];
    const moneyFlows: number[] = [];

    // 计算资金流量
    for (let i = 1; i < high.length; i++) {
      const typicalPrice = (high[i] + low[i] + close[i]) / 3;
      const prevTypicalPrice = (high[i - 1] + low[i - 1] + close[i - 1]) / 3;
      
      const moneyFlow = typicalPrice * volume[i];
      moneyFlows.push(moneyFlow);
    }

    // 计算MFI
    for (let i = period; i < moneyFlows.length; i++) {
      let positiveFlow = 0;
      let negativeFlow = 0;

      for (let j = i - period + 1; j <= i; j++) {
        if (j > 0) {
          const typicalPrice = (high[j] + low[j] + close[j]) / 3;
          const prevTypicalPrice = (high[j - 1] + low[j - 1] + close[j - 1]) / 3;
          
          if (typicalPrice > prevTypicalPrice) {
            positiveFlow += moneyFlows[j - 1];
          } else if (typicalPrice < prevTypicalPrice) {
            negativeFlow += moneyFlows[j - 1];
          }
        }
      }

      const mfiValue = negativeFlow === 0 ? 100 : 100 - (100 / (1 + positiveFlow / negativeFlow));
      mfi.push(mfiValue);
    }

    return mfi;
  }

  /**
   * 计算方向运动指数 (ADX)
   */
  calculateADX(high: number[], low: number[], close: number[], period: number = 14): number[] {
    if (high.length < period * 2) {
      return [];
    }

    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const trueRanges: number[] = [];

    // 计算方向运动和真实波幅
    for (let i = 1; i < high.length; i++) {
      const highDiff = high[i] - high[i - 1];
      const lowDiff = low[i - 1] - low[i];

      let plusDMValue = 0;
      let minusDMValue = 0;

      if (highDiff > lowDiff && highDiff > 0) {
        plusDMValue = highDiff;
      }
      if (lowDiff > highDiff && lowDiff > 0) {
        minusDMValue = lowDiff;
      }

      plusDM.push(plusDMValue);
      minusDM.push(minusDMValue);

      const tr = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      );
      trueRanges.push(tr);
    }

    // 计算平滑值
    const smoothPlusDM = this.calculateEMA(plusDM, period);
    const smoothMinusDM = this.calculateEMA(minusDM, period);
    const smoothTR = this.calculateEMA(trueRanges, period);

    // 计算DI和ADX
    const adx: number[] = [];
    for (let i = 0; i < smoothPlusDM.length; i++) {
      const plusDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
      const minusDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
      const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
      
      if (i === 0) {
        adx.push(dx);
      } else {
        const prevADX = adx[adx.length - 1];
        const newADX = ((prevADX * (period - 1)) + dx) / period;
        adx.push(newADX);
      }
    }

    return adx;
  }

  /**
   * 计算成交量指标 (OBV)
   */
  calculateOBV(close: number[], volume: number[]): number[] {
    if (close.length !== volume.length) {
      return [];
    }

    const obv: number[] = [volume[0]];

    for (let i = 1; i < close.length; i++) {
      let obvValue = obv[i - 1];
      
      if (close[i] > close[i - 1]) {
        obvValue += volume[i];
      } else if (close[i] < close[i - 1]) {
        obvValue -= volume[i];
      }
      
      obv.push(obvValue);
    }

    return obv;
  }

  /**
   * 计算综合技术评分
   */
  calculateTechnicalScore(indicators: TechnicalIndicators, currentPrice: number): number {
    let score = 0;
    let totalWeight = 0;

    // RSI评分 (权重: 20%)
    if (indicators.rsi14 !== undefined) {
      const rsiWeight = 0.2;
      let rsiScore = 0;
      
      if (indicators.rsi14 < 30) rsiScore = 1; // 超卖，看涨信号
      else if (indicators.rsi14 > 70) rsiScore = 0; // 超买，看跌信号
      else rsiScore = 0.5; // 中性
      
      score += rsiScore * rsiWeight;
      totalWeight += rsiWeight;
    }

    // MACD评分 (权重: 25%)
    if (indicators.macd !== undefined && indicators.macdSignal !== undefined) {
      const macdWeight = 0.25;
      let macdScore = 0;
      
      if (indicators.macd > indicators.macdSignal) macdScore = 1; // 金叉，看涨
      else if (indicators.macd < indicators.macdSignal) macdScore = 0; // 死叉，看跌
      else macdScore = 0.5; // 中性
      
      score += macdScore * macdWeight;
      totalWeight += macdWeight;
    }

    // 布林带评分 (权重: 15%)
    if (indicators.bbUpper !== undefined && indicators.bbLower !== undefined && indicators.bbMiddle !== undefined) {
      const bbWeight = 0.15;
      let bbScore = 0;
      
      if (currentPrice < indicators.bbLower) bbScore = 1; // 价格接近下轨，看涨
      else if (currentPrice > indicators.bbUpper) bbScore = 0; // 价格接近上轨，看跌
      else bbScore = 0.5; // 价格在中轨附近，中性
      
      score += bbScore * bbWeight;
      totalWeight += bbWeight;
    }

    // 移动平均线评分 (权重: 20%)
    if (indicators.sma50 !== undefined && indicators.sma200 !== undefined) {
      const maWeight = 0.2;
      let maScore = 0;
      
      if (indicators.sma50 > indicators.sma200) maScore = 1; // 短期均线在长期均线上方，看涨
      else if (indicators.sma50 < indicators.sma200) maScore = 0; // 短期均线在长期均线下方，看跌
      else maScore = 0.5; // 均线交叉，中性
      
      score += maScore * maWeight;
      totalWeight += maWeight;
    }

    // 随机指标评分 (权重: 10%)
    if (indicators.stochK !== undefined && indicators.stochD !== undefined) {
      const stochWeight = 0.1;
      let stochScore = 0;
      
      if (indicators.stochK < 20 && indicators.stochD < 20) stochScore = 1; // 超卖，看涨
      else if (indicators.stochK > 80 && indicators.stochD > 80) stochScore = 0; // 超买，看跌
      else stochScore = 0.5; // 中性
      
      score += stochScore * stochWeight;
      totalWeight += stochWeight;
    }

    // 威廉指标评分 (权重: 10%)
    if (indicators.williamsR !== undefined) {
      const wrWeight = 0.1;
      let wrScore = 0;
      
      if (indicators.williamsR < -80) wrScore = 1; // 超卖，看涨
      else if (indicators.williamsR > -20) wrScore = 0; // 超买，看跌
      else wrScore = 0.5; // 中性
      
      score += wrScore * wrWeight;
      totalWeight += wrWeight;
    }

    return totalWeight > 0 ? score / totalWeight : 0.5;
  }

  /**
   * 生成技术分析信号
   */
  generateSignals(indicators: TechnicalIndicators, currentPrice: number): {
    signals: string[];
    strength: 'strong' | 'moderate' | 'weak';
    direction: 'bullish' | 'bearish' | 'neutral';
  } {
    const signals: string[] = [];
    let bullishCount = 0;
    let bearishCount = 0;

    // RSI信号
    if (indicators.rsi14 !== undefined) {
      if (indicators.rsi14 < 30) {
        signals.push('RSI显示超卖，可能反弹');
        bullishCount++;
      } else if (indicators.rsi14 > 70) {
        signals.push('RSI显示超买，可能回调');
        bearishCount++;
      }
    }

    // MACD信号
    if (indicators.macd !== undefined && indicators.macdSignal !== undefined) {
      if (indicators.macd > indicators.macdSignal) {
        signals.push('MACD金叉，上升趋势');
        bullishCount++;
      } else if (indicators.macd < indicators.macdSignal) {
        signals.push('MACD死叉，下降趋势');
        bearishCount++;
      }
    }

    // 布林带信号
    if (indicators.bbUpper !== undefined && indicators.bbLower !== undefined) {
      if (currentPrice < indicators.bbLower) {
        signals.push('价格触及布林带下轨，可能反弹');
        bullishCount++;
      } else if (currentPrice > indicators.bbUpper) {
        signals.push('价格触及布林带上轨，可能回调');
        bearishCount++;
      }
    }

    // 移动平均线信号
    if (indicators.sma50 !== undefined && indicators.sma200 !== undefined) {
      if (indicators.sma50 > indicators.sma200) {
        signals.push('短期均线在长期均线上方，上升趋势');
        bullishCount++;
      } else if (indicators.sma50 < indicators.sma200) {
        signals.push('短期均线在长期均线下方，下降趋势');
        bearishCount++;
      }
    }

    // 确定信号强度和方向
    const totalSignals = bullishCount + bearishCount;
    let strength: 'strong' | 'moderate' | 'weak' = 'weak';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (totalSignals >= 3) {
      strength = 'strong';
    } else if (totalSignals >= 2) {
      strength = 'moderate';
    }

    if (bullishCount > bearishCount) {
      direction = 'bullish';
    } else if (bearishCount > bullishCount) {
      direction = 'bearish';
    }

    return { signals, strength, direction };
  }
}
