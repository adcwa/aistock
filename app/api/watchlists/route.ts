import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { watchlists, watchlistStocks, stocks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 获取用户的所有观察列表
    const userWatchlists = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, userId))
      .orderBy(watchlists.createdAt);

    // 获取每个观察列表的股票数量
    const watchlistsWithStockCount = await Promise.all(
      userWatchlists.map(async (watchlist) => {
        const stockCount = await db
          .select({ count: watchlistStocks.id })
          .from(watchlistStocks)
          .where(eq(watchlistStocks.watchlistId, watchlist.id));

        return {
          ...watchlist,
          stockCount: stockCount.length,
        };
      })
    );

    return NextResponse.json(watchlistsWithStockCount);

  } catch (error) {
    console.error('Get watchlists error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    // 创建新的观察列表
    const [newWatchlist] = await db
      .insert(watchlists)
      .values({
        userId,
        name,
        description,
      })
      .returning();

    return NextResponse.json(newWatchlist, { status: 201 });

  } catch (error) {
    console.error('Create watchlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
