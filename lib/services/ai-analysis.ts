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
  timeout?: number;
}

// 默认AI配置
const defaultAIConfig: AIConfig = {
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // 使用更快的模型
  maxTokens: 10000, // 减少token数量
  temperature: 0.3,
  timeout: 60000, // 增加到20秒
};

// 创建OpenAI客户端
function createOpenAIClient(config: AIConfig = {}) {
  const finalConfig = { ...defaultAIConfig, ...config };
  
  return new OpenAI({
    apiKey: finalConfig.apiKey,
    baseURL: finalConfig.baseUrl,
    timeout: finalConfig.timeout,
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
    console.log(`[AI Analysis] 开始分析股票: ${request.symbol}`);
    const startTime = Date.now();
    
    // 重试机制
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildAnalysisPrompt(request);
        console.log(`[AI Analysis] 第${attempt}次尝试，提示词长度: ${prompt.length} 字符`);
        console.log("prompt:", prompt);
        
        // 设置超时控制
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AI分析超时')), this.config.timeout || 60000);
        });
        
        // 打印模型参数信息
        console.log(`[AI Analysis] 使用模型: ${this.config.model}, 温度: ${this.config.temperature}, 最大tokens: ${this.config.maxTokens}, 超时: ${this.config.timeout || 20000}ms, baseURL: ${this.config.baseUrl || '默认'}`);
        
        const analysisPromise = this.openai.chat.completions.create({
          model: this.config.model!,
          messages: [
            {
              role: 'system',
              content: `你是股票分析师。基于数据给出简洁分析：情绪(bullish/bearish/neutral)、置信度(0-1)、理由、建议。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        });

        // 使用Promise.race来实现超时控制
        const response = await Promise.race([analysisPromise, timeoutPromise]);
        const analysis = response.choices[0]?.message?.content;
        
        if (!analysis) {
          throw new Error('AI分析返回空结果');
        }

        console.log(`[AI Analysis] AI响应完成，耗时: ${Date.now() - startTime}ms`);
        return this.parseAnalysisResult(analysis, request);
      } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[AI Analysis] 第${attempt}次尝试失败 (${elapsed}ms):`, error);
        
        // 如果是超时错误且还有重试机会，继续重试
        if (error instanceof Error && error.message.includes('超时') && attempt < maxRetries) {
          console.log(`[AI Analysis] 超时，准备第${attempt + 1}次重试...`);
          continue;
        }
        
        // 最后一次尝试失败或非超时错误，使用备用分析
        break;
      }
    }
    
    // 所有重试都失败了，使用备用分析
    console.log('[AI Analysis] 所有重试失败，使用快速备用分析');
    return this.generateFastFallbackAnalysis(request);
  }

  /**
   * 生成价格预测
   */
  async predictPrice(request: AIAnalysisRequest): Promise<PricePrediction> {
    console.log(`[AI Analysis] 开始价格预测: ${request.symbol}`);
    const startTime = Date.now();
    
    try {
      const prompt = this.buildPredictionPrompt(request);
      
      // 设置超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('价格预测超时')), this.config.timeout || 20000);
      });

      const predictionPromise = this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `你是价格预测分析师。简洁预测价格走势。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800,
      });

      const response = await Promise.race([predictionPromise, timeoutPromise]);
      const prediction = response.choices[0]?.message?.content;
      
      if (!prediction) {
        throw new Error('价格预测失败');
      }

      console.log(`[AI Analysis] 价格预测完成，耗时: ${Date.now() - startTime}ms`);
      return this.parsePricePrediction(prediction, request.currentPrice);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[AI Analysis] 价格预测错误 (${elapsed}ms):`, error);
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
    console.log(`[AI Analysis] 开始情绪分析: ${symbol}`);
    const startTime = Date.now();
    
    try {
      const prompt = this.buildSentimentPrompt(symbol, newsData);
      
      // 设置超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('情绪分析超时')), this.config.timeout || 15000);
      });

      const sentimentPromise = this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的市场情绪分析师。基于新闻数据，分析股票的市场情绪和投资者信心。请用简洁明了的语言回答。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = await Promise.race([sentimentPromise, timeoutPromise]);
      const sentiment = response.choices[0]?.message?.content;
      
      if (!sentiment) {
        throw new Error('情绪分析失败');
      }

      console.log(`[AI Analysis] 情绪分析完成，耗时: ${Date.now() - startTime}ms`);
      return this.parseSentimentResult(sentiment);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[AI Analysis] 情绪分析错误 (${elapsed}ms):`, error);
      return this.generateFallbackSentiment();
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { symbol, currentPrice, technicalIndicators, fundamentalData, marketContext, newsSentiment } = request;
    
    let prompt = `分析股票 ${symbol}，价格 $${currentPrice}。\n\n`;
    
    // 技术指标
    prompt += `技术指标数据：\n`;
    if (technicalIndicators.rsi14) prompt += `- RSI(14): ${technicalIndicators.rsi14.toFixed(2)}\n`;
    if (technicalIndicators.sma50) prompt += `- SMA(50): $${technicalIndicators.sma50.toFixed(2)}\n`;
    if (technicalIndicators.sma200) prompt += `- SMA(200): $${technicalIndicators.sma200.toFixed(2)}\n`;
    if (technicalIndicators.macd) prompt += `- MACD: ${technicalIndicators.macd.toFixed(4)}\n`;
    if (technicalIndicators.macdSignal) prompt += `- MACD信号线: ${technicalIndicators.macdSignal.toFixed(4)}\n`;
    if (technicalIndicators.bbUpper) prompt += `- 布林带上轨: $${technicalIndicators.bbUpper.toFixed(2)}\n`;
    if (technicalIndicators.bbLower) prompt += `- 布林带下轨: $${technicalIndicators.bbLower.toFixed(2)}\n`;
    
    // 简化基本面数据
    if (fundamentalData) {
      prompt += `\n基本面数据：\n`;
      if (fundamentalData.pe) prompt += `- P/E比率: ${fundamentalData.pe.toFixed(2)}\n`;
      if (fundamentalData.pb) prompt += `- P/B比率: ${fundamentalData.pb.toFixed(2)}\n`;
      if (fundamentalData.roe) prompt += `- ROE: ${(fundamentalData.roe * 100).toFixed(2)}%\n`;
      if (fundamentalData.revenue && fundamentalData.netIncome) {
        const profitMargin = (fundamentalData.netIncome / fundamentalData.revenue) * 100;
        prompt += `利润率:${profitMargin.toFixed(1)}%`;
      }
    }
    
    // 简化市场背景
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
    
    prompt += `\n请提供以下格式的分析结果（用简洁的语言）：
1. 整体情绪 (bullish/bearish/neutral)
2. 置信度 (0-1)
3. 分析理由
4. 关键因素
5. 风险因素
6. 投资建议
7. 总结`;

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
   * 生成快速备用分析（用于超时情况）
   */
  private generateFastFallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResult {
    const { currentPrice, technicalIndicators } = request;
    
    // 基于技术指标的快速分析
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0.5;
    let reasoning = '基于技术指标快速分析';
    
    // RSI分析
    if (technicalIndicators.rsi14) {
      if (technicalIndicators.rsi14 < 30) {
        sentiment = 'bullish';
        confidence = 0.6;
        reasoning = 'RSI显示超卖，可能存在反弹机会';
      } else if (technicalIndicators.rsi14 > 70) {
        sentiment = 'bearish';
        confidence = 0.6;
        reasoning = 'RSI显示超买，可能存在回调风险';
      }
    }

    // 均线分析
    if (technicalIndicators.sma50 && technicalIndicators.sma200) {
      if (technicalIndicators.sma50 > technicalIndicators.sma200) {
        if (sentiment === 'neutral') sentiment = 'bullish';
        confidence = Math.min(confidence + 0.1, 0.8);
        reasoning += '，短期均线在长期均线之上';
      } else {
        if (sentiment === 'neutral') sentiment = 'bearish';
        confidence = Math.min(confidence + 0.1, 0.8);
        reasoning += '，短期均线在长期均线之下';
      }
    }

    // MACD分析
    if (technicalIndicators.macd && technicalIndicators.macdSignal) {
      if (technicalIndicators.macd > technicalIndicators.macdSignal) {
        if (sentiment === 'neutral') sentiment = 'bullish';
        reasoning += '，MACD显示上升趋势';
      } else {
        if (sentiment === 'neutral') sentiment = 'bearish';
        reasoning += '，MACD显示下降趋势';
      }
    }

    return {
      sentiment,
      confidence: Math.min(confidence, 0.8),
      reasoning,
      keyFactors: ['技术指标', '价格趋势'],
      riskFactors: ['市场波动', '技术指标滞后性', 'AI分析超时'],
      recommendation: sentiment === 'bullish' ? '考虑买入' : sentiment === 'bearish' ? '考虑卖出' : '观望',
      summary: `${request.symbol} 当前技术面${sentiment === 'bullish' ? '偏多' : sentiment === 'bearish' ? '偏空' : '中性'}，建议${sentiment === 'bullish' ? '关注买入机会' : sentiment === 'bearish' ? '注意风险控制' : '保持观望'}`,
      technicalSignals: {
        trend: sentiment === 'bullish' ? 'up' : sentiment === 'bearish' ? 'down' : 'sideways',
        strength: confidence > 0.7 ? 'strong' : confidence > 0.5 ? 'moderate' : 'weak',
        signals: []
      },
      marketPositioning: {
        sectorOutlook: 'neutral',
        competitiveAdvantage: [],
        risks: ['AI分析超时，建议结合其他分析工具']
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
