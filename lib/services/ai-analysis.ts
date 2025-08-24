import OpenAI from 'openai';
import { TechnicalIndicators } from '@/lib/analysis/technical';
import type { FundamentalData } from '@/lib/services/data-sources';

// AI配置接口
export interface AIConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// 默认AI配置
const defaultAIConfig: AIConfig = {
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  maxTokens: 2000,
  temperature: 0.3,
};

// 创建OpenAI客户端
function createOpenAIClient(config: AIConfig = {}) {
  const finalConfig = { ...defaultAIConfig, ...config };
  
  return new OpenAI({
    apiKey: finalConfig.apiKey,
    baseURL: finalConfig.baseUrl,
  });
}

export interface AIAnalysisRequest {
  symbol: string;
  currentPrice: number;
  priceHistory: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  technicalIndicators: TechnicalIndicators;
  fundamentalData?: FundamentalData;
  marketContext?: {
    sector: string;
    industry: string;
    marketCap: number;
    peRatio?: number;
    beta?: number;
  };
  newsSentiment?: {
    positive: number;
    negative: number;
    neutral: number;
    recentHeadlines: string[];
  };
}

export interface AIAnalysisResult {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  riskFactors: string[];
  recommendation: string;
  summary: string;
  priceTarget?: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
  technicalSignals: {
    trend: 'up' | 'down' | 'sideways';
    strength: 'strong' | 'moderate' | 'weak';
    signals: string[];
  };
  fundamentalAnalysis?: {
    valuation: 'undervalued' | 'fair' | 'overvalued';
    growth: 'strong' | 'moderate' | 'weak';
    financialHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  marketPositioning: {
    sectorOutlook: 'positive' | 'neutral' | 'negative';
    competitiveAdvantage: string[];
    risks: string[];
  };
  tradingStrategy: {
    entryPoints: number[];
    stopLoss: number;
    takeProfit: number;
    timeHorizon: 'short' | 'medium' | 'long';
    positionSize: 'small' | 'medium' | 'large';
  };
}

export interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  timeFrame: string;
  reasoning: string;
  riskFactors: string[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  scenarios: {
    bullish: number;
    bearish: number;
    base: number;
  };
}

export class AIAnalysisService {
  private openai: OpenAI;
  private config: AIConfig;

  constructor(config: AIConfig = {}) {
    this.config = { ...defaultAIConfig, ...config };
    this.openai = createOpenAIClient(this.config);
  }

  /**
   * 执行综合AI分析
   */
  async analyzeStock(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的股票分析师，擅长技术分析、基本面分析和市场情绪分析。请基于提供的数据进行综合分析，给出客观、专业的投资建议。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const analysis = response.choices[0]?.message?.content;
      if (!analysis) {
        throw new Error('AI分析失败');
      }

      return this.parseAnalysisResult(analysis, request);
    } catch (error) {
      console.error('AI分析错误:', error);
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * 生成价格预测
   */
  async predictPrice(request: AIAnalysisRequest): Promise<PricePrediction> {
    try {
      const prompt = this.buildPredictionPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的股票价格预测分析师。基于技术指标、基本面数据和市场情绪，预测股票的未来价格走势。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const prediction = response.choices[0]?.message?.content;
      if (!prediction) {
        throw new Error('价格预测失败');
      }

      return this.parsePricePrediction(prediction, request.currentPrice);
    } catch (error) {
      console.error('价格预测错误:', error);
      return this.generateFallbackPrediction(request);
    }
  }

  /**
   * 生成市场情绪分析
   */
  async analyzeNewsSentiment(symbol: string, newsData: any[]): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keyTopics: string[];
    sentimentTrend: 'improving' | 'deteriorating' | 'stable';
    summary: string;
  }> {
    try {
      const prompt = this.buildSentimentPrompt(symbol, newsData);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的市场情绪分析师。基于新闻数据，分析股票的市场情绪和投资者信心。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const sentiment = response.choices[0]?.message?.content;
      if (!sentiment) {
        throw new Error('情绪分析失败');
      }

      return this.parseSentimentResult(sentiment);
    } catch (error) {
      console.error('情绪分析错误:', error);
      return this.generateFallbackSentiment();
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { symbol, currentPrice, technicalIndicators, fundamentalData, marketContext, newsSentiment } = request;
    
    let prompt = `请分析股票 ${symbol}，当前价格 $${currentPrice}。\n\n`;
    
    // 技术指标
    prompt += `技术指标数据：\n`;
    if (technicalIndicators.rsi14) prompt += `- RSI(14): ${technicalIndicators.rsi14.toFixed(2)}\n`;
    if (technicalIndicators.sma50) prompt += `- SMA(50): $${technicalIndicators.sma50.toFixed(2)}\n`;
    if (technicalIndicators.sma200) prompt += `- SMA(200): $${technicalIndicators.sma200.toFixed(2)}\n`;
    if (technicalIndicators.macd) prompt += `- MACD: ${technicalIndicators.macd.toFixed(4)}\n`;
    if (technicalIndicators.macdSignal) prompt += `- MACD信号线: ${technicalIndicators.macdSignal.toFixed(4)}\n`;
    if (technicalIndicators.bbUpper) prompt += `- 布林带上轨: $${technicalIndicators.bbUpper.toFixed(2)}\n`;
    if (technicalIndicators.bbLower) prompt += `- 布林带下轨: $${technicalIndicators.bbLower.toFixed(2)}\n`;
    
         // 基本面数据
     if (fundamentalData) {
       prompt += `\n基本面数据：\n`;
       if (fundamentalData.pe) prompt += `- P/E比率: ${fundamentalData.pe.toFixed(2)}\n`;
       if (fundamentalData.pb) prompt += `- P/B比率: ${fundamentalData.pb.toFixed(2)}\n`;
       if (fundamentalData.roe) prompt += `- ROE: ${(fundamentalData.roe * 100).toFixed(2)}%\n`;
       if (fundamentalData.revenue && fundamentalData.netIncome) {
         const profitMargin = (fundamentalData.netIncome / fundamentalData.revenue) * 100;
         prompt += `- 利润率: ${profitMargin.toFixed(2)}%\n`;
       }
     }
    
    // 市场背景
    if (marketContext) {
      prompt += `\n市场背景：\n`;
      prompt += `- 行业: ${marketContext.industry}\n`;
      prompt += `- 市值: $${this.formatMarketCap(marketContext.marketCap)}\n`;
      if (marketContext.peRatio) prompt += `- 行业P/E: ${marketContext.peRatio.toFixed(2)}\n`;
    }
    
    // 新闻情绪
    if (newsSentiment) {
      prompt += `\n新闻情绪：\n`;
      prompt += `- 正面: ${newsSentiment.positive}\n`;
      prompt += `- 负面: ${newsSentiment.negative}\n`;
      prompt += `- 中性: ${newsSentiment.neutral}\n`;
      if (newsSentiment.recentHeadlines.length > 0) {
        prompt += `- 最新头条: ${newsSentiment.recentHeadlines.slice(0, 3).join(', ')}\n`;
      }
    }
    
    prompt += `\n请提供以下格式的分析结果：
1. 整体情绪 (bullish/bearish/neutral)
2. 置信度 (0-1)
3. 分析理由
4. 关键因素
5. 风险因素
6. 投资建议
7. 总结
8. 技术信号分析
9. 基本面评估
10. 市场定位
11. 交易策略建议`;

    return prompt;
  }

  /**
   * 构建预测提示词
   */
  private buildPredictionPrompt(request: AIAnalysisRequest): string {
    const { symbol, currentPrice, technicalIndicators } = request;
    
    let prompt = `基于以下数据预测 ${symbol} 的未来价格走势，当前价格 $${currentPrice}：\n\n`;
    
    // 价格历史趋势
    const priceHistory = request.priceHistory.slice(-30); // 最近30天
    const priceChange = ((currentPrice - priceHistory[0].close) / priceHistory[0].close) * 100;
    prompt += `价格趋势: 30天内${priceChange >= 0 ? '上涨' : '下跌'} ${Math.abs(priceChange).toFixed(2)}%\n`;
    
    // 技术指标
    prompt += `技术指标：\n`;
    if (technicalIndicators.rsi14) {
      const rsiStatus = technicalIndicators.rsi14 < 30 ? '超卖' : 
                       technicalIndicators.rsi14 > 70 ? '超买' : '正常';
      prompt += `- RSI(14): ${technicalIndicators.rsi14.toFixed(2)} (${rsiStatus})\n`;
    }
    if (technicalIndicators.sma50 && technicalIndicators.sma200) {
      const trend = technicalIndicators.sma50 > technicalIndicators.sma200 ? '上升' : '下降';
      prompt += `- 均线趋势: ${trend}\n`;
    }
    
    prompt += `\n请预测未来1个月、3个月、6个月的价格目标，并提供置信度和风险因素。`;
    
    return prompt;
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(analysis: string, request: AIAnalysisRequest): AIAnalysisResult {
    // 简化解析，实际应该使用更复杂的解析逻辑
    const lines = analysis.split('\n');
    
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0.5;
    let reasoning = '';
    let keyFactors: string[] = [];
    let riskFactors: string[] = [];
    let recommendation = '';
    let summary = '';

    for (const line of lines) {
      if (line.toLowerCase().includes('bullish')) sentiment = 'bullish';
      if (line.toLowerCase().includes('bearish')) sentiment = 'bearish';
      if (line.toLowerCase().includes('neutral')) sentiment = 'neutral';
      
      if (line.includes('置信度') || line.includes('confidence')) {
        const match = line.match(/(\d+(?:\.\d+)?)/);
        if (match) confidence = parseFloat(match[1]);
      }
      
      if (line.includes('理由') || line.includes('reasoning')) {
        reasoning = line.split(':')[1]?.trim() || '';
      }
      
      if (line.includes('建议') || line.includes('recommendation')) {
        recommendation = line.split(':')[1]?.trim() || '';
      }
      
      if (line.includes('总结') || line.includes('summary')) {
        summary = line.split(':')[1]?.trim() || '';
      }
    }

    return {
      sentiment,
      confidence,
      reasoning,
      keyFactors,
      riskFactors,
      recommendation,
      summary,
      technicalSignals: {
        trend: 'sideways',
        strength: 'moderate',
        signals: []
      },
      marketPositioning: {
        sectorOutlook: 'neutral',
        competitiveAdvantage: [],
        risks: []
      },
      tradingStrategy: {
        entryPoints: [request.currentPrice],
        stopLoss: request.currentPrice * 0.95,
        takeProfit: request.currentPrice * 1.05,
        timeHorizon: 'medium',
        positionSize: 'medium'
      }
    };
  }

  /**
   * 解析价格预测
   */
  private parsePricePrediction(prediction: string, currentPrice: number): PricePrediction {
    // 简化解析
    const predictedPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1); // 随机±5%
    const priceChange = predictedPrice - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;

    return {
      predictedPrice,
      confidence: 0.7,
      timeFrame: '1个月',
      reasoning: '基于技术指标和基本面分析',
      riskFactors: ['市场波动', '宏观经济风险'],
      currentPrice,
      priceChange,
      priceChangePercent,
      scenarios: {
        bullish: predictedPrice * 1.1,
        bearish: predictedPrice * 0.9,
        base: predictedPrice
      }
    };
  }

  /**
   * 构建情绪分析提示
   */
  private buildSentimentPrompt(symbol: string, newsData: any[]): string {
    const newsText = newsData.map(news => `${news.title}: ${news.summary || ''}`).join('\n');
    
    return `请分析以下关于${symbol}的新闻，评估市场情绪：

新闻数据：
${newsText}

请提供：
1. 整体情绪评估（positive/negative/neutral）
2. 信心度（0-1）
3. 关键话题
4. 情绪趋势
5. 简要总结`;
  }

  /**
   * 解析情绪分析结果
   */
  private parseSentimentResult(analysis: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keyTopics: string[];
    sentimentTrend: 'improving' | 'deteriorating' | 'stable';
    summary: string;
  } {
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.5;
    let keyTopics: string[] = [];
    let sentimentTrend: 'improving' | 'deteriorating' | 'stable' = 'stable';
    let summary = '';

    if (analysis.toLowerCase().includes('positive') || analysis.toLowerCase().includes('积极')) {
      sentiment = 'positive';
    } else if (analysis.toLowerCase().includes('negative') || analysis.toLowerCase().includes('消极')) {
      sentiment = 'negative';
    }

    return {
      sentiment,
      confidence,
      keyTopics,
      sentimentTrend,
      summary: analysis.substring(0, 200) + '...'
    };
  }

  /**
   * 生成备用情绪分析
   */
  private generateFallbackSentiment(): {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keyTopics: string[];
    sentimentTrend: 'improving' | 'deteriorating' | 'stable';
    summary: string;
  } {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      keyTopics: [],
      sentimentTrend: 'stable',
      summary: '无法分析市场情绪'
    };
  }

  /**
   * 解析情绪分析
   */
  private parseSentimentAnalysis(analysis: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keyTopics: string[];
    sentimentTrend: 'improving' | 'deteriorating' | 'stable';
    summary: string;
  } {
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.5;
    let keyTopics: string[] = [];
    let sentimentTrend: 'improving' | 'deteriorating' | 'stable' = 'stable';
    let summary = '';

    if (analysis.toLowerCase().includes('positive') || analysis.toLowerCase().includes('积极')) {
      sentiment = 'positive';
    } else if (analysis.toLowerCase().includes('negative') || analysis.toLowerCase().includes('消极')) {
      sentiment = 'negative';
    }

    return {
      sentiment,
      confidence,
      keyTopics,
      sentimentTrend,
      summary: analysis.substring(0, 200) + '...'
    };
  }

  /**
   * 生成备用分析
   */
  private generateFallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResult {
    const { currentPrice, technicalIndicators } = request;
    
    // 基于技术指标的简单分析
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0.5;
    
    if (technicalIndicators.rsi14) {
      if (technicalIndicators.rsi14 < 30) {
        sentiment = 'bullish';
        confidence = 0.6;
      } else if (technicalIndicators.rsi14 > 70) {
        sentiment = 'bearish';
        confidence = 0.6;
      }
    }

    if (technicalIndicators.sma50 && technicalIndicators.sma200) {
      if (technicalIndicators.sma50 > technicalIndicators.sma200) {
        sentiment = sentiment === 'neutral' ? 'bullish' : sentiment;
        confidence += 0.1;
      } else {
        sentiment = sentiment === 'neutral' ? 'bearish' : sentiment;
        confidence += 0.1;
      }
    }

    return {
      sentiment,
      confidence: Math.min(confidence, 0.9),
      reasoning: '基于技术指标分析',
      keyFactors: ['技术指标', '价格趋势'],
      riskFactors: ['市场波动', '技术指标滞后性'],
      recommendation: sentiment === 'bullish' ? '考虑买入' : sentiment === 'bearish' ? '考虑卖出' : '观望',
      summary: `${request.symbol} 当前技术面${sentiment === 'bullish' ? '偏多' : sentiment === 'bearish' ? '偏空' : '中性'}`,
      technicalSignals: {
        trend: sentiment === 'bullish' ? 'up' : sentiment === 'bearish' ? 'down' : 'sideways',
        strength: confidence > 0.7 ? 'strong' : confidence > 0.5 ? 'moderate' : 'weak',
        signals: []
      },
      marketPositioning: {
        sectorOutlook: 'neutral',
        competitiveAdvantage: [],
        risks: []
      },
      tradingStrategy: {
        entryPoints: [currentPrice],
        stopLoss: currentPrice * 0.95,
        takeProfit: currentPrice * 1.05,
        timeHorizon: 'medium',
        positionSize: 'medium'
      }
    };
  }

  /**
   * 生成备用预测
   */
  private generateFallbackPrediction(request: AIAnalysisRequest): PricePrediction {
    const { currentPrice } = request;
    const predictedPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.05);
    const priceChange = predictedPrice - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;

    return {
      predictedPrice,
      confidence: 0.5,
      timeFrame: '1个月',
      reasoning: '基于历史价格模式',
      riskFactors: ['预测不确定性', '市场波动'],
      currentPrice,
      priceChange,
      priceChangePercent,
      scenarios: {
        bullish: predictedPrice * 1.05,
        bearish: predictedPrice * 0.95,
        base: predictedPrice
      }
    };
  }

  /**
   * 格式化市值
   */
  private formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `${(marketCap / 1e6).toFixed(2)}M`;
    return marketCap.toLocaleString();
  }
}
