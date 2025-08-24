import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

export async function POST(request: NextRequest) {
  try {
    const { promptType, config } = await request.json();

    // 从localStorage获取AI配置
    const aiConfig = {
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.3,
    };

    const aiService = new AIAnalysisService(aiConfig);

    // 模拟测试数据
    const testData = {
      symbol: 'AAPL',
      currentPrice: 150.25,
      priceHistory: [
        {
          date: '2024-01-01',
          open: 148.0,
          high: 152.0,
          low: 147.5,
          close: 150.25,
          volume: 1000000,
        }
      ],
      technicalIndicators: {
        rsi14: 65.5,
        macd: 2.3,
        sma50: 150.25,
        bbUpper: 155.0,
        bbLower: 145.0,
      },
      fundamentalData: {
        reportDate: new Date('2024-01-01'),
        year: 2024,
        pe: 25.5,
        pb: 8.2,
        roe: 15.8,
        revenue: 394328000000,
        netIncome: 96995000000,
        eps: 6.16,
      },
      marketContext: {
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 2500000000000,
        peRatio: 25.5,
        beta: 1.2,
      },
      newsSentiment: {
        positive: 0.6,
        negative: 0.2,
        neutral: 0.2,
        recentHeadlines: ['Apple Reports Strong Q4 Earnings'],
      },
    };

    let response = '';
    let prompt = '';

    switch (promptType) {
      case 'system':
        prompt = config.systemPrompt;
        response = 'System prompt configured successfully.';
        break;
      case 'analysis':
        prompt = config.analysisPrompt
          .replace('{symbol}', testData.symbol)
          .replace('{technicalData}', JSON.stringify(testData.technicalIndicators, null, 2))
          .replace('{fundamentalData}', JSON.stringify(testData.fundamentalData, null, 2))
          .replace('{newsData}', JSON.stringify(testData.newsSentiment, null, 2));
        
        const analysis = await aiService.analyzeStock(testData);
        response = analysis.summary || 'Analysis completed successfully.';
        break;
      case 'sentiment':
        prompt = config.sentimentPrompt
          .replace('{symbol}', testData.symbol)
          .replace('{newsData}', JSON.stringify(testData.newsSentiment, null, 2));
        
        const sentiment = await aiService.analyzeNewsSentiment(testData.symbol, [
          { title: 'Apple Reports Strong Q4 Earnings', summary: 'Positive earnings report' }
        ]);
        response = sentiment.summary || 'Sentiment analysis completed successfully.';
        break;
      default:
        if (config.customPrompts && config.customPrompts[promptType]) {
          prompt = config.customPrompts[promptType]
            .replace('{symbol}', testData.symbol)
            .replace('{technicalData}', JSON.stringify(testData.technicalIndicators, null, 2))
            .replace('{fundamentalData}', JSON.stringify(testData.fundamentalData, null, 2))
            .replace('{newsData}', JSON.stringify(testData.newsSentiment, null, 2));
          
          const customAnalysis = await aiService.analyzeStock(testData);
          response = customAnalysis.summary || 'Custom analysis completed successfully.';
        } else {
          return NextResponse.json(
            { error: 'Invalid prompt type' },
            { status: 400 }
          );
        }
    }

    return NextResponse.json({
      success: true,
      promptType,
      prompt,
      response,
    });

  } catch (error) {
    console.error('Prompt test error:', error);
    return NextResponse.json(
      { error: 'Failed to test prompt' },
      { status: 500 }
    );
  }
}
