import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { AnalysisHistoryService } from '@/lib/services/analysis-history';

const analysisHistoryService = new AnalysisHistoryService();

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const days = parseInt(searchParams.get('days') || '30');

    const [history, stats, bestWorst] = await Promise.all([
      analysisHistoryService.getUserAnalysisHistory(user.id, limit, offset),
      analysisHistoryService.getAccuracyStats(user.id, days),
      analysisHistoryService.getBestWorstAnalyses(user.id, 5),
    ]);

    return NextResponse.json({
      history,
      stats,
      bestWorst,
    });
  } catch (error) {
    console.error('Analysis history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
