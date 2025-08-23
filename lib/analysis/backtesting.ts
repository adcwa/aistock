export interface BacktestStrategy {
  name: string;
  description: string;
  parameters: Record<string, number>;
  entryRules: (data: BacktestDataPoint) => boolean;
  exitRules: (data: BacktestDataPoint) => boolean;
  positionSize: (data: BacktestDataPoint) => number;
}

export interface BacktestDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: {
    sma50?: number;
    sma200?: number;
    rsi14?: number;
    macd?: number;
    macdSignal?: number;
    bbUpper?: number;
    bbLower?: number;
    bbMiddle?: number;
    stochK?: number;
    stochD?: number;
    williamsR?: number;
    atr?: number;
    adx?: number;
    cci?: number;
    mfi?: number;
  };
}

export interface Trade {
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  position: 'long' | 'short';
  size: number;
  pnl?: number;
  pnlPercent?: number;
  status: 'open' | 'closed';
}

export interface BacktestResult {
  strategy: BacktestStrategy;
  trades: Trade[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    averageTradeDuration: number;
    totalPnL: number;
    initialCapital: number;
    finalCapital: number;
  };
  equity: Array<{
    date: string;
    equity: number;
    drawdown: number;
  }>;
  monthlyReturns: Array<{
    month: string;
    return: number;
  }>;
}

export class BacktestingEngine {
  private initialCapital: number;
  private commission: number;
  private slippage: number;

  constructor(initialCapital: number = 100000, commission: number = 0.001, slippage: number = 0.0005) {
    this.initialCapital = initialCapital;
    this.commission = commission;
    this.slippage = slippage;
  }

  /**
   * 运行回溯测试
   */
  runBacktest(strategy: BacktestStrategy, data: BacktestDataPoint[]): BacktestResult {
    const trades: Trade[] = [];
    let currentCapital = this.initialCapital;
    let currentPosition: Trade | null = null;
    const equity: Array<{ date: string; equity: number; drawdown: number }> = [];
    let peakEquity = this.initialCapital;

    for (let i = 0; i < data.length; i++) {
      const dataPoint = data[i];
      const currentEquity = this.calculateCurrentEquity(currentCapital, currentPosition, dataPoint.close);

      // 记录权益曲线
      equity.push({
        date: dataPoint.date,
        equity: currentEquity,
        drawdown: (peakEquity - currentEquity) / peakEquity
      });

      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }

      // 检查退出条件
      if (currentPosition && strategy.exitRules(dataPoint)) {
        const exitPrice = this.applySlippage(dataPoint.close, currentPosition.position === 'short');
        const pnl = this.calculatePnL(currentPosition, exitPrice);
        const pnlPercent = (pnl / (currentPosition.entryPrice * currentPosition.size)) * 100;

        currentPosition.exitDate = dataPoint.date;
        currentPosition.exitPrice = exitPrice;
        currentPosition.pnl = pnl;
        currentPosition.pnlPercent = pnlPercent;
        currentPosition.status = 'closed';

        currentCapital += pnl;
        trades.push(currentPosition);
        currentPosition = null;
      }

      // 检查进入条件
      if (!currentPosition && strategy.entryRules(dataPoint)) {
        const positionSize = strategy.positionSize(dataPoint);
        const entryPrice = this.applySlippage(dataPoint.close, false);
        const position = entryPrice * positionSize > currentCapital ? 'long' : 'short';

        currentPosition = {
          entryDate: dataPoint.date,
          entryPrice,
          position,
          size: positionSize,
          status: 'open'
        };
      }
    }

    // 关闭未平仓的交易
    if (currentPosition) {
      const lastPrice = data[data.length - 1].close;
      const exitPrice = this.applySlippage(lastPrice, currentPosition.position === 'short');
      const pnl = this.calculatePnL(currentPosition, exitPrice);
      const pnlPercent = (pnl / (currentPosition.entryPrice * currentPosition.size)) * 100;

      currentPosition.exitDate = data[data.length - 1].date;
      currentPosition.exitPrice = exitPrice;
      currentPosition.pnl = pnl;
      currentPosition.pnlPercent = pnlPercent;
      currentPosition.status = 'closed';

      currentCapital += pnl;
      trades.push(currentPosition);
    }

    const metrics = this.calculateMetrics(trades, this.initialCapital, currentCapital);
    const monthlyReturns = this.calculateMonthlyReturns(trades, data);

    return {
      strategy,
      trades,
      metrics,
      equity,
      monthlyReturns
    };
  }

  /**
   * 应用滑点
   */
  private applySlippage(price: number, isShort: boolean): number {
    const slippageAmount = price * this.slippage;
    return isShort ? price + slippageAmount : price - slippageAmount;
  }

  /**
   * 计算当前权益
   */
  private calculateCurrentEquity(capital: number, position: Trade | null, currentPrice: number): number {
    if (!position) return capital;

    const unrealizedPnL = this.calculatePnL(position, currentPrice);
    return capital + unrealizedPnL;
  }

  /**
   * 计算盈亏
   */
  private calculatePnL(trade: Trade, currentPrice: number): number {
    const priceDiff = trade.position === 'long' ? currentPrice - trade.entryPrice : trade.entryPrice - currentPrice;
    const grossPnL = priceDiff * trade.size;
    const commissionCost = (trade.entryPrice + currentPrice) * trade.size * this.commission;
    return grossPnL - commissionCost;
  }

  /**
   * 计算回测指标
   */
  private calculateMetrics(trades: Trade[], initialCapital: number, finalCapital: number) {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0;

    // 计算平均交易持续时间
    const tradeDurations = closedTrades.map(t => {
      const entryDate = new Date(t.entryDate);
      const exitDate = new Date(t.exitDate!);
      return (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24); // 天数
    });
    const averageTradeDuration = tradeDurations.length > 0 ? 
      tradeDurations.reduce((sum, d) => sum + d, 0) / tradeDurations.length : 0;

    // 计算年化收益率
    const totalReturn = (finalCapital - initialCapital) / initialCapital;
    const daysInPeriod = closedTrades.length > 0 ? 
      (new Date(closedTrades[closedTrades.length - 1].exitDate!).getTime() - 
       new Date(closedTrades[0].entryDate).getTime()) / (1000 * 60 * 60 * 24) : 365;
    const annualizedReturn = daysInPeriod > 0 ? Math.pow(1 + totalReturn, 365 / daysInPeriod) - 1 : 0;

    // 计算夏普比率（简化版）
    const returns = closedTrades.map(t => (t.pnlPercent || 0) / 100);
    const averageReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const variance = returns.length > 0 ? 
      returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length : 0;
    const sharpeRatio = variance > 0 ? averageReturn / Math.sqrt(variance) : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0,
      totalReturn,
      annualizedReturn,
      maxDrawdown: 0, // 将在权益曲线中计算
      sharpeRatio,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      averageTradeDuration,
      totalPnL,
      initialCapital,
      finalCapital
    };
  }

  /**
   * 计算月度收益
   */
  private calculateMonthlyReturns(trades: Trade[], data: BacktestDataPoint[]): Array<{ month: string; return: number }> {
    const monthlyPnL: Record<string, number> = {};
    
    trades.forEach(trade => {
      if (trade.exitDate) {
        const month = trade.exitDate.substring(0, 7); // YYYY-MM
        monthlyPnL[month] = (monthlyPnL[month] || 0) + (trade.pnl || 0);
      }
    });

    return Object.entries(monthlyPnL)
      .map(([month, pnl]) => ({
        month,
        return: pnl / this.initialCapital
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * 预定义策略
   */
  static getPredefinedStrategies(): BacktestStrategy[] {
    return [
      {
        name: '移动平均线交叉策略',
        description: '当短期均线上穿长期均线时买入，下穿时卖出',
        parameters: { shortPeriod: 50, longPeriod: 200 },
        entryRules: (data) => {
          return data.indicators.sma50 !== undefined && 
                 data.indicators.sma200 !== undefined &&
                 data.indicators.sma50 > data.indicators.sma200;
        },
        exitRules: (data) => {
          return data.indicators.sma50 !== undefined && 
                 data.indicators.sma200 !== undefined &&
                 data.indicators.sma50 < data.indicators.sma200;
        },
        positionSize: (data) => 1.0
      },
      {
        name: 'RSI超买超卖策略',
        description: 'RSI低于30时买入，高于70时卖出',
        parameters: { oversold: 30, overbought: 70 },
        entryRules: (data) => {
          return data.indicators.rsi14 !== undefined && data.indicators.rsi14 < 30;
        },
        exitRules: (data) => {
          return data.indicators.rsi14 !== undefined && data.indicators.rsi14 > 70;
        },
        positionSize: (data) => 1.0
      },
      {
        name: 'MACD金叉死叉策略',
        description: 'MACD线上穿信号线时买入，下穿时卖出',
        parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
        entryRules: (data) => {
          return data.indicators.macd !== undefined && 
                 data.indicators.macdSignal !== undefined &&
                 data.indicators.macd > data.indicators.macdSignal;
        },
        exitRules: (data) => {
          return data.indicators.macd !== undefined && 
                 data.indicators.macdSignal !== undefined &&
                 data.indicators.macd < data.indicators.macdSignal;
        },
        positionSize: (data) => 1.0
      },
      {
        name: '布林带策略',
        description: '价格触及下轨时买入，触及上轨时卖出',
        parameters: { period: 20, stdDev: 2 },
        entryRules: (data) => {
          return data.indicators.bbLower !== undefined && 
                 data.close <= data.indicators.bbLower;
        },
        exitRules: (data) => {
          return data.indicators.bbUpper !== undefined && 
                 data.close >= data.indicators.bbUpper;
        },
        positionSize: (data) => 1.0
      },
      {
        name: '多重信号策略',
        description: '结合多个技术指标的综合策略',
        parameters: { rsiOversold: 30, rsiOverbought: 70 },
        entryRules: (data) => {
          const rsiSignal = data.indicators.rsi14 !== undefined && data.indicators.rsi14 < 30;
          const macdSignal = data.indicators.macd !== undefined && 
                           data.indicators.macdSignal !== undefined &&
                           data.indicators.macd > data.indicators.macdSignal;
          const bbSignal = data.indicators.bbLower !== undefined && 
                          data.close <= data.indicators.bbLower;
          
          return (rsiSignal && macdSignal) || (rsiSignal && bbSignal);
        },
        exitRules: (data) => {
          const rsiSignal = data.indicators.rsi14 !== undefined && data.indicators.rsi14 > 70;
          const macdSignal = data.indicators.macd !== undefined && 
                           data.indicators.macdSignal !== undefined &&
                           data.indicators.macd < data.indicators.macdSignal;
          const bbSignal = data.indicators.bbUpper !== undefined && 
                          data.close >= data.indicators.bbUpper;
          
          return (rsiSignal && macdSignal) || (rsiSignal && bbSignal);
        },
        positionSize: (data) => 1.0
      }
    ];
  }

  /**
   * 优化策略参数
   */
  optimizeStrategy(
    baseStrategy: BacktestStrategy,
    data: BacktestDataPoint[],
    parameterRanges: Record<string, { min: number; max: number; step: number }>
  ): { bestParams: Record<string, number>; bestResult: BacktestResult } {
    let bestResult: BacktestResult | null = null;
    let bestParams: Record<string, number> = {};
    let bestSharpeRatio = -Infinity;

    // 生成参数组合
    const paramCombinations = this.generateParameterCombinations(parameterRanges);

    for (const params of paramCombinations) {
      const strategy = { ...baseStrategy, parameters: { ...baseStrategy.parameters, ...params } };
      const result = this.runBacktest(strategy, data);

      if (result.metrics.sharpeRatio > bestSharpeRatio) {
        bestSharpeRatio = result.metrics.sharpeRatio;
        bestResult = result;
        bestParams = params;
      }
    }

    return { bestParams, bestResult: bestResult! };
  }

  /**
   * 生成参数组合
   */
  private generateParameterCombinations(ranges: Record<string, { min: number; max: number; step: number }>): Record<string, number>[] {
    const paramNames = Object.keys(ranges);
    const combinations: Record<string, number>[] = [];

    const generateCombinations = (index: number, currentParams: Record<string, number>) => {
      if (index === paramNames.length) {
        combinations.push({ ...currentParams });
        return;
      }

      const paramName = paramNames[index];
      const range = ranges[paramName];

      for (let value = range.min; value <= range.max; value += range.step) {
        currentParams[paramName] = value;
        generateCombinations(index + 1, currentParams);
      }
    };

    generateCombinations(0, {});
    return combinations;
  }
}
