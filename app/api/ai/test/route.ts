import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // 验证配置
    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'API密钥不能为空' },
        { status: 400 }
      );
    }

    if (!config.baseUrl) {
      return NextResponse.json(
        { error: 'API基础URL不能为空' },
        { status: 400 }
      );
    }

    // 创建AI分析服务实例
    const aiService = new AIAnalysisService(config);

    // 测试AI连接
    const testAnalysis = await aiService.analyzeStock({
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
        rsi14: 50,
        macd: 0.1,
        sma50: 148,
        sma200: 145,
        bbUpper: 155,
        bbLower: 145,
        bbMiddle: 150,
      },
      fundamentalData: {
        reportDate: new Date('2024-01-01'),
        year: 2024,
        pe: 25,
        pb: 3,
        roe: 15,
        debtToEquity: 0.5,
        revenue: 394328000000,
        netIncome: 96995000000,
        eps: 6.16,
      },
      marketContext: {
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 2500000000000,
        peRatio: 25,
        beta: 1.2,
      },
      newsSentiment: {
        positive: 0.6,
        negative: 0.2,
        neutral: 0.2,
        recentHeadlines: ['Apple Reports Strong Q4 Earnings'],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'AI配置测试成功',
      testResult: {
        sentiment: testAnalysis.sentiment,
        confidence: testAnalysis.confidence,
        summary: testAnalysis.summary,
      },
    });

  } catch (error) {
    console.error('AI test error:', error);
    
    // 根据错误类型返回不同的错误信息
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'API密钥无效，请检查您的OpenAI API密钥' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'API基础URL无效，请检查URL是否正确' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API调用频率超限，请稍后重试' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'AI配置测试失败，请检查配置是否正确' },
      { status: 500 }
    );
  }
}
