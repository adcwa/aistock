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

    const aiService = new AIAnalysisService(aiConfig, config);

    // 模拟测试数据
    const testData = {
      symbol: 'AAPL',
      technicalData: {
        rsi: 65.5,
        macd: 2.3,
        sma50: 150.25,
        bbUpper: 155.0,
        bbLower: 145.0,
      },
      fundamentalData: {
        peRatio: 25.5,
        pbRatio: 8.2,
        roe: 15.8,
        revenueGrowth: 8.5,
      },
      newsData: [
        {
          title: 'Apple Reports Strong Q4 Earnings',
          sentiment: 'positive',
        },
      ],
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
          .replace('{technicalData}', JSON.stringify(testData.technicalData, null, 2))
          .replace('{fundamentalData}', JSON.stringify(testData.fundamentalData, null, 2))
          .replace('{newsData}', JSON.stringify(testData.newsData, null, 2));
        
        const analysis = await aiService.analyzeStock(testData);
        response = analysis.summary || 'Analysis completed successfully.';
        break;
      case 'sentiment':
        prompt = config.sentimentPrompt
          .replace('{symbol}', testData.symbol)
          .replace('{newsData}', JSON.stringify(testData.newsData, null, 2));
        
        const sentiment = await aiService.analyzeNewsSentiment(testData.symbol, testData.newsData);
        response = sentiment.summary || 'Sentiment analysis completed successfully.';
        break;
      default:
        if (config.customPrompts && config.customPrompts[promptType]) {
          prompt = config.customPrompts[promptType]
            .replace('{symbol}', testData.symbol)
            .replace('{technicalData}', JSON.stringify(testData.technicalData, null, 2))
            .replace('{fundamentalData}', JSON.stringify(testData.fundamentalData, null, 2))
            .replace('{newsData}', JSON.stringify(testData.newsData, null, 2));
          
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
