import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { stocks, stockPrices, fundamentals, technicalIndicators, recommendations } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { AlphaVantageService } from '@/lib/services/alpha-vantage';
import { TechnicalAnalysisEngine } from '@/lib/analysis/technical';
import { FundamentalAnalysisEngine } from '@/lib/analysis/fundamental';
import { RecommendationEngine } from '@/lib/analysis/recommendation';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
import { AnalysisHistoryService } from '@/lib/services/analysis-history';
import { PricePredictionService } from '@/lib/services/price-prediction';
import { eq, desc, and } from 'drizzle-orm';

const alphaVantageService = new AlphaVantageService();
const technicalEngine = new TechnicalAnalysisEngine();
const fundamentalEngine = new FundamentalAnalysisEngine();
const recommendationEngine = new RecommendationEngine();
const aiAnalysisService = new AIAnalysisService();
const analysisHistoryService = new AnalysisHistoryService();
const pricePredictionService = new PricePredictionService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const symbolUpper = symbol.toUpperCase();

    // 获取股票信息
    const stock = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbolUpper))
      .limit(1);

    if (stock.length === 0) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    const stockId = stock[0].id;

    // 获取价格数据
    const prices = await db
      .select()
      .from(stockPrices)
      .where(and(eq(stockPrices.stockId, stockId), eq(stockPrices.interval, '1d')))
      .orderBy(desc(stockPrices.timestamp))
      .limit(200); // 获取足够的数据进行技术分析

    // 获取基本面数据
    const fundamentalData = await db
      .select()
      .from(fundamentals)
      .where(eq(fundamentals.stockId, stockId))
      .orderBy(desc(fundamentals.reportDate))
      .limit(10);

    // 如果数据不足，从API获取
    if (prices.length < 50) {
      try {
        const apiPrices = await alphaVantageService.getHistoricalPrices(symbolUpper, 'daily');
        
        if (apiPrices.length > 0) {
          const pricesToInsert = apiPrices
            .filter(price => 
              !isNaN(price.open) && 
              !isNaN(price.high) && 
              !isNaN(price.low) && 
              !isNaN(price.close) && 
              !isNaN(price.volume)
            )
            .map(price => ({
              stockId,
              timestamp: price.timestamp,
              open: price.open.toString(),
              high: price.high.toString(),
              low: price.low.toString(),
              close: price.close.toString(),
              volume: price.volume,
              interval: price.interval,
            }));

          if (pricesToInsert.length > 0) {
            await db.insert(stockPrices).values(pricesToInsert);
          }
          
          // 重新获取价格数据
          const updatedPrices = await db
            .select()
            .from(stockPrices)
            .where(and(eq(stockPrices.stockId, stockId), eq(stockPrices.interval, '1d')))
            .orderBy(desc(stockPrices.timestamp))
            .limit(200);

          prices.push(...updatedPrices);
        }
      } catch (apiError) {
        console.error('Failed to fetch price data from API:', apiError);
      }
    }

    if (fundamentalData.length === 0) {
      try {
        const apiFundamentals = await alphaVantageService.getFundamentals(symbolUpper);
        
        if (apiFundamentals.length > 0) {
          const fundamentalsToInsert = apiFundamentals
            .filter(fundamental => 
              fundamental.revenue !== undefined && 
              fundamental.netIncome !== undefined &&
              !isNaN(fundamental.revenue) && 
              !isNaN(fundamental.netIncome)
            )
            .map(fundamental => ({
              stockId,
              reportDate: fundamental.reportDate,
              quarter: fundamental.quarter,
              year: fundamental.year,
              revenue: fundamental.revenue,
              netIncome: fundamental.netIncome,
              eps: fundamental.eps?.toString(),
            }));

          if (fundamentalsToInsert.length > 0) {
            await db.insert(fundamentals).values(fundamentalsToInsert);
          }
          
          // 重新获取基本面数据
          const updatedFundamentals = await db
            .select()
            .from(fundamentals)
            .where(eq(fundamentals.stockId, stockId))
            .orderBy(desc(fundamentals.reportDate))
            .limit(10);

          fundamentalData.push(...updatedFundamentals);
        }
      } catch (apiError) {
        console.error('Failed to fetch fundamental data from API:', apiError);
      }
    }

    // 进行技术分析
    const priceValues = prices.map(p => parseFloat(p.close.toString())).reverse();
    const volumeValues = prices.map(p => p.volume).reverse();
    
    // 计算技术指标
    const sma50 = technicalEngine.calculateSMA(priceValues, 50);
    const sma200 = technicalEngine.calculateSMA(priceValues, 200);
    const rsi14 = technicalEngine.calculateRSI(priceValues, 14);
    const macd = technicalEngine.calculateMACD(priceValues);
    const bb = technicalEngine.calculateBollingerBands(priceValues);
    const obv = technicalEngine.calculateOBV(priceValues, volumeValues);
    
    // 获取最新指标值
    const technicalIndicators = {
      sma50: sma50.length > 0 ? sma50[sma50.length - 1] : undefined,
      sma200: sma200.length > 0 ? sma200[sma200.length - 1] : undefined,
      rsi14: rsi14.length > 0 ? rsi14[rsi14.length - 1] : undefined,
      macd: macd.macd.length > 0 ? macd.macd[macd.macd.length - 1] : undefined,
      macdSignal: macd.signal.length > 0 ? macd.signal[macd.signal.length - 1] : undefined,
      bbUpper: bb.upper.length > 0 ? bb.upper[bb.upper.length - 1] : undefined,
      bbLower: bb.lower.length > 0 ? bb.lower[bb.lower.length - 1] : undefined,
      bbMiddle: bb.middle.length > 0 ? bb.middle[bb.middle.length - 1] : undefined,
      obv: obv.length > 0 ? obv[obv.length - 1] : undefined,
    };
    
    const currentPrice = priceValues.length > 0 ? priceValues[0] : 0;
    const technicalScore = technicalEngine.calculateTechnicalScore(technicalIndicators, currentPrice);

    // 进行基本面分析
    const fundamentalDataConverted = fundamentalData.map(f => ({
      reportDate: f.reportDate,
      quarter: f.quarter || undefined,
      year: f.year,
      revenue: f.revenue || undefined,
      netIncome: f.netIncome || undefined,
      eps: f.eps ? parseFloat(f.eps) : undefined,
    }));
    const financialRatios = fundamentalEngine.calculateFinancialRatios(fundamentalDataConverted);
    const fundamentalScore = fundamentalEngine.calculateFundamentalScore(financialRatios);

    // AI分析
    const aiAnalysis = await aiAnalysisService.analyzeStock({
      symbol: symbolUpper,
      currentPrice,
      priceHistory: prices.map(p => ({
        date: p.timestamp.toISOString().split('T')[0],
        open: parseFloat(p.open.toString()),
        high: parseFloat(p.high.toString()),
        low: parseFloat(p.low.toString()),
        close: parseFloat(p.close.toString()),
        volume: p.volume,
      })),
      technicalIndicators,
      fundamentalData: fundamentalDataConverted[0], // 使用最新的基本面数据
      marketContext: {
        sector: stock[0]?.sector || '',
        industry: stock[0]?.industry || '',
        marketCap: stock[0]?.marketCap || 0,
      },
      newsSentiment: {
        positive: 0,
        negative: 0,
        neutral: 0,
        recentHeadlines: [],
      },
    });

    // 使用AI分析结果
    const sentimentScore = aiAnalysis.sentiment === 'bullish' ? 0.8 : 
                          aiAnalysis.sentiment === 'bearish' ? 0.2 : 0.5;

    // 计算宏观经济分数（暂时使用中性值）
    const macroScore = 0.5;

    // 生成推荐
    const analysisScores = {
      technical: technicalScore,
      fundamental: fundamentalScore,
      sentiment: sentimentScore,
      macro: macroScore,
    };

    const overallScore = recommendationEngine.calculateOverallScore(analysisScores);
    const recommendation = recommendationEngine.generateRecommendation(overallScore);

    // 生成价格预测
    let pricePrediction = null;
    if (currentPrice > 0) {
      pricePrediction = pricePredictionService.predictPrice({
        currentPrice,
        technicalIndicators,
        financialRatios,
        recommendation: recommendation.recommendation,
        confidence: recommendation.confidence,
        marketTrend: aiAnalysis.sentiment === 'bullish' ? 'bullish' : aiAnalysis.sentiment === 'bearish' ? 'bearish' : 'neutral',
      });
    }

    // 保存推荐到数据库
    await db.insert(recommendations).values({
      stockId,
      recommendation: recommendation.recommendation,
      confidence: recommendation.confidence.toString(),
      reasoning: recommendation.reasoning,
      technicalScore: recommendation.scores.technical.toString(),
      fundamentalScore: recommendation.scores.fundamental.toString(),
      sentimentScore: recommendation.scores.sentiment.toString(),
      macroScore: recommendation.scores.macro.toString(),
    });

    // 保存分析历史（如果有用户ID）
    try {
      const user = await getUser();
      if (user) {
        await analysisHistoryService.saveAnalysis({
          userId: user.id,
          stockId,
          recommendation: recommendation.recommendation,
          confidence: recommendation.confidence,
          technicalScore: recommendation.scores.technical,
          fundamentalScore: recommendation.scores.fundamental,
          sentimentScore: recommendation.scores.sentiment,
          macroScore: recommendation.scores.macro,
          overallScore: overallScore.score,
          reasoning: recommendation.reasoning,
          aiSentiment: aiAnalysis.sentiment,
          aiConfidence: aiAnalysis.confidence,
          aiReasoning: aiAnalysis.reasoning,
          predictedPrice: pricePrediction?.predictedPrice,
        });
      }
    } catch (error) {
      console.error('Failed to save analysis history:', error);
      // 不阻止分析完成，只记录错误
    }



    return NextResponse.json({
      stock: stock[0],
      analysis: {
        technical: {
          indicators: technicalIndicators,
          score: technicalScore,
        },
        fundamental: {
          ratios: financialRatios,
          score: fundamentalScore,
          summary: fundamentalEngine.getFundamentalSummary(financialRatios),
        },
        ai: {
          sentiment: aiAnalysis.sentiment,
          confidence: aiAnalysis.confidence,
          reasoning: aiAnalysis.reasoning,
          keyFactors: aiAnalysis.keyFactors,
          riskFactors: aiAnalysis.riskFactors,
          recommendation: aiAnalysis.recommendation,
          summary: aiAnalysis.summary,
        },
        recommendation: {
          ...recommendation,
          summary: recommendationEngine.getRecommendationSummary(recommendation),
          riskWarning: recommendationEngine.getRiskWarning(recommendation),
        },
        pricePrediction: pricePrediction ? {
          predictedPrice: pricePrediction.predictedPrice,
          confidence: pricePrediction.confidence,
          timeFrame: pricePrediction.timeFrame,
          reasoning: pricePrediction.reasoning,
          riskFactors: pricePrediction.riskFactors,
          currentPrice,
          priceChange: pricePrediction.predictedPrice - currentPrice,
          priceChangePercent: ((pricePrediction.predictedPrice - currentPrice) / currentPrice) * 100,
        } : null,
        scores: analysisScores,
        overallScore: overallScore.score,
        confidence: overallScore.confidence,
      },
      dataPoints: {
        prices: prices.length,
        fundamentals: fundamentalData.length,
      },
    });

  } catch (error) {
    console.error('Stock analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
