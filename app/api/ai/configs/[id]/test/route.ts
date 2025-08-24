import { NextRequest, NextResponse } from 'next/server';
import { AIConfigService } from '@/lib/services/ai-config';
import { SubscriptionService } from '@/lib/services/subscription';
import { getSession } from '@/lib/auth/session';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有自定义AI配置权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'customAIConfig');

    const configId = parseInt(params.id);
    if (isNaN(configId)) {
      return NextResponse.json({ error: '无效的配置ID' }, { status: 400 });
    }

    // 获取配置详情
    const configs = await AIConfigService.getUserConfigs(session.user.id);
    const config = configs.find(c => c.id === configId);
    
    if (!config) {
      return NextResponse.json({ error: 'AI配置不存在' }, { status: 404 });
    }

    // 创建AI分析服务实例
    const aiService = new AIAnalysisService({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    });

    const startTime = Date.now();

    // 测试AI连接和分析
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

    const responseTime = Date.now() - startTime;

    // 记录使用情况
    await AIConfigService.recordUsage({
      userId: session.user.id,
      configId: config.id,
      stockSymbol: 'AAPL',
      tokensUsed: 1000, // 估算值
      cost: 0.002, // 估算值
      responseTime,
      success: true,
      errorMessage: null
    });

    return NextResponse.json({
      success: true,
      message: 'AI配置测试成功',
      data: {
        sentiment: testAnalysis.sentiment,
        confidence: testAnalysis.confidence,
        summary: testAnalysis.summary,
        responseTime,
        config: {
          name: config.name,
          model: config.model,
          baseUrl: config.baseUrl
        }
      }
    });

  } catch (error) {
    console.error('AI config test error:', error);
    
    // 记录失败的使用情况
    try {
      const configId = parseInt(params.id);
      if (!isNaN(configId)) {
        await AIConfigService.recordUsage({
          userId: session?.user?.id || 0,
          configId,
          stockSymbol: 'AAPL',
          tokensUsed: 0,
          cost: 0,
          responseTime: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (recordError) {
      console.error('Failed to record usage:', recordError);
    }
    
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
