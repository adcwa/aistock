import { NextRequest, NextResponse } from 'next/server';
import { BacktestingEngine } from '@/lib/analysis/backtesting';
import { TechnicalAnalysisEngine } from '@/lib/analysis/technical';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const body = await request.json();
    const { strategyName, initialCapital = 100000, commission = 0.001, slippage = 0.0005 } = body;

    // 获取历史价格数据（这里应该从数据库或API获取）
    // 暂时使用模拟数据
    const priceData = generateMockPriceData(symbol, 252); // 一年的交易日数据

    // 计算技术指标
    const technicalEngine = new TechnicalAnalysisEngine();
    const closePrices = priceData.map(d => d.close);
    const highPrices = priceData.map(d => d.high);
    const lowPrices = priceData.map(d => d.low);
    const volumes = priceData.map(d => d.volume);

    const sma50 = technicalEngine.calculateSMA(closePrices, 50);
    const sma200 = technicalEngine.calculateSMA(closePrices, 200);
    const rsi14 = technicalEngine.calculateRSI(closePrices, 14);
    const macd = technicalEngine.calculateMACD(closePrices);
    const bb = technicalEngine.calculateBollingerBands(closePrices);
    const stoch = technicalEngine.calculateStochastic(highPrices, lowPrices, closePrices);
    const williamsR = technicalEngine.calculateWilliamsR(highPrices, lowPrices, closePrices);

    // 准备回测数据
    const backtestData = priceData.map((d, i) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
      indicators: {
        sma50: sma50[i - 49] || undefined, // 前49个数据点没有SMA50
        sma200: sma200[i - 199] || undefined, // 前199个数据点没有SMA200
        rsi14: rsi14[i - 14] || undefined, // 前14个数据点没有RSI
        macd: macd.macd[i - 25] || undefined, // 前25个数据点没有MACD
        macdSignal: macd.signal[i - 25] || undefined,
        bbUpper: bb.upper[i - 19] || undefined, // 前19个数据点没有布林带
        bbLower: bb.lower[i - 19] || undefined,
        bbMiddle: bb.middle[i - 19] || undefined,
        stochK: stoch.k[i - 13] || undefined, // 前13个数据点没有随机指标
        stochD: stoch.d[i - 13] || undefined,
        williamsR: williamsR[i - 13] || undefined,
      }
    })).filter(d => d.indicators.sma50 !== undefined); // 过滤掉没有足够数据的点

    // 获取策略
    const strategies = BacktestingEngine.getPredefinedStrategies();
    const strategy = strategies.find(s => s.name === strategyName);
    
    if (!strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    // 运行回测
    const engine = new BacktestingEngine(initialCapital, commission, slippage);
    const result = engine.runBacktest(strategy, backtestData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Backtesting error:', error);
    return NextResponse.json(
      { error: 'Failed to run backtest' },
      { status: 500 }
    );
  }
}

// 生成模拟价格数据
function generateMockPriceData(symbol: string, days: number) {
  const data = [];
  let price = 100; // 起始价格
  const volatility = 0.02; // 日波动率

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // 生成随机价格变动
    const change = (Math.random() - 0.5) * volatility;
    price = price * (1 + change);
    
    const open = price;
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    const close = price * (1 + (Math.random() - 0.5) * 0.005);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }

  return data;
}
