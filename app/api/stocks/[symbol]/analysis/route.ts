import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { stocks, stockPrices, fundamentals, technicalIndicators, recommendations, analysisHistory } from '@/lib/db/schema';
import { AlphaVantageService } from '@/lib/services/alpha-vantage';
import { TechnicalAnalysisEngine } from '@/lib/analysis/technical';
import { FundamentalAnalysisEngine } from '@/lib/analysis/fundamental';
import { RecommendationEngine } from '@/lib/analysis/recommendation';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
import { AnalysisHistoryService } from '@/lib/services/analysis-history';

import { eq, desc, and, sql } from 'drizzle-orm';

const alphaVantageService = new AlphaVantageService();
const technicalEngine = new TechnicalAnalysisEngine();
const fundamentalEngine = new FundamentalAnalysisEngine();
const recommendationEngine = new RecommendationEngine();
const aiAnalysisService = new AIAnalysisService();
const analysisHistoryService = new AnalysisHistoryService();

// 日志记录器
class AnalysisLogger {
  private logs: string[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  log(message: string) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    const logEntry = `[${timestamp}] [${elapsed}ms] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  getLogs() {
    return this.logs;
  }

  getElapsedTime() {
    return Date.now() - this.startTime;
  }
}

// 动态导入 getUser 函数以避免 PPR 问题
async function getUserSafely() {
  try {
    const { getUser } = await import('@/lib/db/queries');
    return await getUser();
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

// 超时检查函数
function checkTimeout(startTime: number, maxTimeout: number = 25000) {
  const elapsed = Date.now() - startTime;
  if (elapsed > maxTimeout) {
    throw new Error(`Analysis timeout after ${elapsed}ms`);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const logger = new AnalysisLogger();
  const startTime = Date.now();
  
  try {
    logger.log('开始股票分析请求');
    
    const { symbol } = await params;
    const symbolUpper = symbol.toUpperCase();
    logger.log(`分析股票: ${symbolUpper}`);
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';
    logger.log(`强制刷新: ${forceRefresh}`);

    // 检查超时
    checkTimeout(startTime);

    // 获取股票信息
    logger.log('获取股票基本信息');
    const stock = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbolUpper))
      .limit(1);

    if (stock.length === 0) {
      logger.log(`股票未找到: ${symbolUpper}`);
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    const stockId = stock[0].id;
    logger.log(`股票ID: ${stockId}`);

    // 检查是否有今天的分析结果（如果不强制刷新）
    if (!forceRefresh) {
      logger.log('检查缓存的分析结果');
      
      // 获取用户信息
      const user = await getUserSafely();
      
      if (user) {
        // 从分析历史表获取最新的分析结果
        const existingAnalysis = await db
          .select()
          .from(analysisHistory)
          .where(
            and(
              eq(analysisHistory.stockId, stockId),
              eq(analysisHistory.userId, user.id),
              sql`DATE(${analysisHistory.createdAt}) = DATE(${sql`CURRENT_DATE`})`
            )
          )
          .orderBy(desc(analysisHistory.createdAt))
          .limit(1);

        if (existingAnalysis.length > 0) {
          logger.log('找到缓存的分析结果，直接返回');
          const cachedAnalysis = existingAnalysis[0];
          
          // 返回缓存的分析结果，使用实际的分析数据
          return NextResponse.json({
            stock: stock[0],
            analysis: {
              technical: {
                indicators: {}, // 简化返回，避免重复计算
                score: parseFloat((cachedAnalysis.technicalScore ?? 0).toString()),
              },
              fundamental: {
                ratios: {},
                score: parseFloat((cachedAnalysis.fundamentalScore ?? 0).toString()),
                summary: '使用今日缓存的分析结果',
              },
              ai: {
                sentiment: cachedAnalysis.aiSentiment || 'neutral',
                confidence: parseFloat((cachedAnalysis.aiConfidence ?? 0.5).toString()),
                reasoning: cachedAnalysis.aiReasoning || '使用今日缓存的分析结果',
                keyFactors: [],
                riskFactors: [],
                recommendation: '使用今日缓存的分析结果',
                summary: '使用今日缓存的分析结果',
              },
              recommendation: {
                recommendation: cachedAnalysis.recommendation,
                confidence: parseFloat(cachedAnalysis.confidence.toString()),
                reasoning: cachedAnalysis.reasoning || '使用今日缓存的分析结果',
                summary: '使用今日缓存的分析结果',
                riskWarning: '基于今日缓存数据的分析结果',
              },
              pricePrediction: null,
              scores: {
                technical: parseFloat((cachedAnalysis.technicalScore ?? 0).toString()),
                fundamental: parseFloat((cachedAnalysis.fundamentalScore ?? 0).toString()),
                sentiment: parseFloat((cachedAnalysis.sentimentScore ?? 0).toString()),
                macro: parseFloat((cachedAnalysis.macroScore ?? 0).toString()),
              },
              overallScore: parseFloat((cachedAnalysis.overallScore ?? 0.5).toString()),
              confidence: parseFloat(cachedAnalysis.confidence.toString()),
            },
            dataPoints: {
              prices: 0,
              fundamentals: 0,
            },
            cached: true,
            cachedAt: cachedAnalysis.createdAt,
            analysisHistoryId: cachedAnalysis.id,
            logs: logger.getLogs(),
            executionTime: logger.getElapsedTime(),
          });
        }
      }
    }

    // 检查超时
    checkTimeout(startTime);

    // 获取价格数据
    logger.log('获取价格数据');
    const prices = await db
      .select()
      .from(stockPrices)
      .where(and(eq(stockPrices.stockId, stockId), eq(stockPrices.interval, '1d')))
      .orderBy(desc(stockPrices.timestamp))
      .limit(200); // 获取足够的数据进行技术分析

    logger.log(`从数据库获取到 ${prices.length} 条价格数据`);

    // 检查超时
    checkTimeout(startTime);

    // 获取基本面数据
    logger.log('获取基本面数据');
    const fundamentalData = await db
      .select()
      .from(fundamentals)
      .where(eq(fundamentals.stockId, stockId))
      .orderBy(desc(fundamentals.reportDate))
      .limit(10);

    logger.log(`从数据库获取到 ${fundamentalData.length} 条基本面数据`);

    // 如果数据不足，从API获取
    if (prices.length < 50) {
      logger.log('价格数据不足，从API获取补充数据');
      try {
        const apiPrices = await alphaVantageService.getHistoricalPrices(symbolUpper, 'daily');
        logger.log(`从API获取到 ${apiPrices.length} 条价格数据`);
        
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
            logger.log(`插入 ${pricesToInsert.length} 条价格数据到数据库`);
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
          logger.log(`更新后总共有 ${prices.length} 条价格数据`);
        }
      } catch (apiError) {
        logger.log(`API获取价格数据失败: ${apiError}`);
        console.error('Failed to fetch price data from API:', apiError);
      }
    }

    // 检查超时
    checkTimeout(startTime);

    if (fundamentalData.length === 0) {
      logger.log('基本面数据不足，从API获取补充数据');
      try {
        const apiFundamentals = await alphaVantageService.getFundamentals(symbolUpper);
        logger.log(`从API获取到 ${apiFundamentals.length} 条基本面数据`);
        
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
            logger.log(`插入 ${fundamentalsToInsert.length} 条基本面数据到数据库`);
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
          logger.log(`更新后总共有 ${fundamentalData.length} 条基本面数据`);
        }
      } catch (apiError) {
        logger.log(`API获取基本面数据失败: ${apiError}`);
        console.error('Failed to fetch fundamental data from API:', apiError);
      }
    }

    // 检查超时
    checkTimeout(startTime);

    // 进行技术分析
    logger.log('开始技术分析');
    const priceValues = prices.map(p => parseFloat(p.close.toString())).reverse();
    const volumeValues = prices.map(p => p.volume).reverse();
    
    // 计算技术指标
    logger.log('计算技术指标');
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
    logger.log(`技术分析完成，得分: ${technicalScore}`);

    // 检查超时
    checkTimeout(startTime);

    // 进行基本面分析
    logger.log('开始基本面分析');
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
    logger.log(`基本面分析完成，得分: ${fundamentalScore}`);

    // 检查超时
    checkTimeout(startTime);

    // AI分析 - 设置较短的超时时间
    logger.log('开始AI分析');
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
    logger.log(`AI分析完成，情绪: ${aiAnalysis.sentiment}`);

    // 检查超时
    checkTimeout(startTime);

    // 使用AI分析结果
    const sentimentScore = aiAnalysis.sentiment === 'bullish' ? 0.8 : 
                          aiAnalysis.sentiment === 'bearish' ? 0.2 : 0.5;

    // 计算宏观经济分数（暂时使用中性值）
    const macroScore = 0.5;

    // 生成推荐
    logger.log('生成投资推荐');
    const analysisScores = {
      technical: technicalScore,
      fundamental: fundamentalScore,
      sentiment: sentimentScore,
      macro: macroScore,
    };

    const overallScore = recommendationEngine.calculateOverallScore(analysisScores);
    const recommendation = recommendationEngine.generateRecommendation(overallScore);
    logger.log(`推荐生成完成: ${recommendation.recommendation}`);

    // 检查超时
    checkTimeout(startTime);

    // 保存推荐到数据库
    logger.log('保存推荐到数据库');
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

    // 保存分析历史（如果有用户ID）- 使用安全的 getUser 调用
    try {
      const user = await getUserSafely();
      if (user) {
        logger.log('保存分析历史');
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
          predictedPrice: undefined,
        });
      }
    } catch (error) {
      logger.log(`保存分析历史失败: ${error}`);
      console.error('Failed to save analysis history:', error);
      // 不阻止分析完成，只记录错误
    }

    logger.log('分析完成，准备返回结果');

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
        pricePrediction: null,
        scores: analysisScores,
        overallScore: overallScore.score,
        confidence: overallScore.confidence,
      },
      dataPoints: {
        prices: prices.length,
        fundamentals: fundamentalData.length,
      },
      logs: logger.getLogs(),
      executionTime: logger.getElapsedTime(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.log(`分析过程中发生错误: ${errorMessage}`);
    console.error('Stock analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        logs: logger.getLogs(),
        executionTime: logger.getElapsedTime(),
      },
      { status: 500 }
    );
  }
}
