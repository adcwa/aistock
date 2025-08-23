import OpenAI from 'openai';
import { AIConfig, AnalysisRequest, AIAnalysis, NewsArticle } from '@/lib/data-sources/data-sources';

export interface AIPromptConfig {
  systemPrompt?: string;
  analysisPrompt?: string;
  sentimentPrompt?: string;
  customPrompts?: Record<string, string>;
}

export class AIAnalysisService {
  private openai: OpenAI;
  private config: AIConfig;
  private promptConfig: AIPromptConfig;

  constructor(config?: Partial<AIConfig>, promptConfig?: AIPromptConfig) {
    this.config = {
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.3,
      ...config,
    };

    this.promptConfig = {
      systemPrompt: `You are an expert financial analyst specializing in stock market analysis. 
      Provide comprehensive, data-driven insights based on technical indicators, fundamental data, and market sentiment.
      Always be objective and include risk factors in your analysis.`,
      analysisPrompt: `Analyze the following stock data for {symbol}:

Technical Indicators:
{technicalData}

Fundamental Data:
{fundamentalData}

News Sentiment:
{newsData}

Please provide:
1. Overall sentiment (bullish/bearish/neutral)
2. Confidence level (0-1)
3. Key factors supporting your analysis
4. Risk factors to consider
5. Investment recommendation (buy/hold/sell)
6. Summary of analysis`,
      sentimentPrompt: `Analyze the sentiment of the following news articles for {symbol}:
{newsData}

Provide:
1. Overall sentiment (positive/negative/neutral)
2. Confidence level (0-1)
3. Key themes and their sentiment
4. Impact on stock price`,
      ...promptConfig,
    };

    this.openai = new OpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
    });
  }

  /**
   * 分析股票数据
   */
  async analyzeStock(request: AnalysisRequest): Promise<AIAnalysis> {
    if (!this.config.apiKey) {
      return this.getFallbackAnalysis(request.symbol);
    }

    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.promptConfig.systemPrompt || 'You are an expert financial analyst.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const analysis = this.parseAIResponse(response.choices[0]?.message?.content || '');
      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.getFallbackAnalysis(request.symbol);
    }
  }

  /**
   * 分析新闻情感
   */
  async analyzeNewsSentiment(symbol: string, articles: NewsArticle[]): Promise<AIAnalysis> {
    if (!this.config.apiKey || articles.length === 0) {
      return this.getFallbackAnalysis(symbol);
    }

    try {
      const prompt = this.buildSentimentPrompt(symbol, articles);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in financial news sentiment analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const analysis = this.parseAIResponse(response.choices[0]?.message?.content || '');
      return analysis;
    } catch (error) {
      console.error('News sentiment analysis error:', error);
      return this.getFallbackAnalysis(symbol);
    }
  }

  /**
   * 构建分析提示
   */
  private buildAnalysisPrompt(request: AnalysisRequest): string {
    const { symbol, technicalData, fundamentalData, newsData } = request;
    
    const prompt = this.promptConfig.analysisPrompt || `Analyze {symbol} stock based on the following data:

Technical Indicators:
{technicalData}

Fundamental Data:
{fundamentalData}

News Sentiment:
{newsData}

Please provide:
1. Overall sentiment (bullish/bearish/neutral)
2. Confidence level (0-1)
3. Key factors supporting your analysis
4. Risk factors to consider
5. Investment recommendation (buy/hold/sell)
6. Summary of analysis`;

    return prompt
      .replace('{symbol}', symbol)
      .replace('{technicalData}', JSON.stringify(technicalData, null, 2))
      .replace('{fundamentalData}', JSON.stringify(fundamentalData, null, 2))
      .replace('{newsData}', JSON.stringify(newsData, null, 2));
  }

  /**
   * 构建情感分析提示
   */
  private buildSentimentPrompt(symbol: string, articles: NewsArticle[]): string {
    const prompt = this.promptConfig.sentimentPrompt || `Analyze the sentiment of the following news articles for {symbol}:
{newsData}

Provide:
1. Overall sentiment (positive/negative/neutral)
2. Confidence level (0-1)
3. Key themes and their sentiment
4. Impact on stock price`;

    return prompt
      .replace('{symbol}', symbol)
      .replace('{newsData}', JSON.stringify(articles, null, 2));
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): AIAnalysis {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || 'neutral',
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || 'Analysis based on available data',
          keyFactors: parsed.keyFactors || [],
          riskFactors: parsed.riskFactors || [],
          recommendation: parsed.recommendation || 'hold',
          summary: parsed.summary || 'Analysis completed',
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    // 回退解析
    return this.parseTextResponse(response);
  }

  /**
   * 解析文本响应
   */
  private parseTextResponse(response: string): AIAnalysis {
    const sentiment = response.toLowerCase().includes('bullish') ? 'bullish' :
                     response.toLowerCase().includes('bearish') ? 'bearish' : 'neutral';
    
    const confidence = response.includes('confidence') ? 
      parseFloat(response.match(/confidence[:\s]*([\d.]+)/i)?.[1] || '0.5') : 0.5;

    const recommendation = response.toLowerCase().includes('buy') ? 'buy' :
                          response.toLowerCase().includes('sell') ? 'sell' : 'hold';

    return {
      sentiment,
      confidence: Math.min(1, Math.max(0, confidence)),
      reasoning: response.substring(0, 200) + '...',
      keyFactors: [],
      riskFactors: [],
      recommendation,
      summary: 'Analysis completed based on available data',
    };
  }

  /**
   * 获取回退分析
   */
  private getFallbackAnalysis(symbol: string): AIAnalysis {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      reasoning: 'Analysis not available. Please check your AI configuration.',
      keyFactors: ['Limited data available'],
      riskFactors: ['AI analysis not configured'],
      recommendation: 'hold',
      summary: 'Unable to provide AI analysis. Please configure OpenAI API key.',
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AIConfig>, promptConfig?: AIPromptConfig): void {
    this.config = { ...this.config, ...config };
    if (promptConfig) {
      this.promptConfig = { ...this.promptConfig, ...promptConfig };
    }
    
    this.openai = new OpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
    });
  }

  /**
   * 获取当前配置
   */
  getConfig(): { config: AIConfig; promptConfig: AIPromptConfig } {
    return {
      config: { ...this.config },
      promptConfig: { ...this.promptConfig },
    };
  }
}
