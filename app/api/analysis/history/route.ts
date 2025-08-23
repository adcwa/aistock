import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { analysisHistory, stocks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 获取用户的分析历史，包含股票信息
    const userAnalysisHistory = await db
      .select({
        id: analysisHistory.id,
        stockId: analysisHistory.stockId,
        recommendation: analysisHistory.recommendation,
        confidence: analysisHistory.confidence,
        technicalScore: analysisHistory.technicalScore,
        fundamentalScore: analysisHistory.fundamentalScore,
        sentimentScore: analysisHistory.sentimentScore,
        macroScore: analysisHistory.macroScore,
        overallScore: analysisHistory.overallScore,
        reasoning: analysisHistory.reasoning,
        aiSentiment: analysisHistory.aiSentiment,
        aiConfidence: analysisHistory.aiConfidence,
        aiReasoning: analysisHistory.aiReasoning,
        predictedPrice: analysisHistory.predictedPrice,
        createdAt: analysisHistory.createdAt,
        stock: {
          symbol: stocks.symbol,
          companyName: stocks.companyName,
        },
      })
      .from(analysisHistory)
      .innerJoin(stocks, eq(analysisHistory.stockId, stocks.id))
      .where(eq(analysisHistory.userId, userId))
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit);

    // 格式化返回数据
    const formattedHistory = userAnalysisHistory.map(record => ({
      id: record.id,
      stockId: record.stockId,
      stockSymbol: record.stock.symbol,
      stockName: record.stock.companyName,
      recommendation: record.recommendation,
      confidence: parseFloat(record.confidence.toString()),
      technicalScore: parseFloat(record.technicalScore.toString()),
      fundamentalScore: parseFloat(record.fundamentalScore.toString()),
      sentimentScore: parseFloat(record.sentimentScore.toString()),
      macroScore: parseFloat(record.macroScore.toString()),
      overallScore: parseFloat(record.overallScore.toString()),
      reasoning: record.reasoning,
      aiSentiment: record.aiSentiment,
      aiConfidence: record.aiConfidence ? parseFloat(record.aiConfidence.toString()) : null,
      aiReasoning: record.aiReasoning,
      predictedPrice: record.predictedPrice ? parseFloat(record.predictedPrice.toString()) : null,
      createdAt: record.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedHistory);

  } catch (error) {
    console.error('Get analysis history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
