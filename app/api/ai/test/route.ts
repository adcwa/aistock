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
      technicalData: {
        rsi: 50,
        macd: 0.1,
        sma20: 150,
        sma50: 148,
        bbUpper: 155,
        bbLower: 145,
        volume: 1000000,
      },
      fundamentalData: {
        peRatio: 25,
        pbRatio: 3,
        roe: 15,
        debtToEquity: 0.5,
        profitMargin: 20,
        revenueGrowth: 10,
        earningsGrowth: 12,
      },
      newsData: [],
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
