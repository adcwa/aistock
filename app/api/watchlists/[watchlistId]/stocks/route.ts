import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { watchlistStocks, stocks, watchlists } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ watchlistId: string }> }
) {
  try {
    const { watchlistId: watchlistIdStr } = await params;
    const watchlistId = parseInt(watchlistIdStr);

    // 验证观察列表是否存在
    const watchlist = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, watchlistId))
      .limit(1);

    if (watchlist.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // 获取观察列表中的所有股票
    const watchlistStocksData = await db
      .select({
        id: watchlistStocks.id,
        addedAt: watchlistStocks.addedAt,
        stock: {
          id: stocks.id,
          symbol: stocks.symbol,
          companyName: stocks.companyName,
          sector: stocks.sector,
          industry: stocks.industry,
          marketCap: stocks.marketCap,
        },
      })
      .from(watchlistStocks)
      .innerJoin(stocks, eq(watchlistStocks.stockId, stocks.id))
      .where(eq(watchlistStocks.watchlistId, watchlistId))
      .orderBy(watchlistStocks.addedAt);

    return NextResponse.json(watchlistStocksData);

  } catch (error) {
    console.error('Get watchlist stocks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ watchlistId: string }> }
) {
  try {
    const { watchlistId: watchlistIdStr } = await params;
    const watchlistId = parseInt(watchlistIdStr);
    const body = await request.json();
    const { stockId } = body;

    if (!stockId) {
      return NextResponse.json(
        { error: 'Stock ID is required' },
        { status: 400 }
      );
    }

    // 验证观察列表是否存在
    const watchlist = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, watchlistId))
      .limit(1);

    if (watchlist.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // 验证股票是否存在
    const stock = await db
      .select()
      .from(stocks)
      .where(eq(stocks.id, stockId))
      .limit(1);

    if (stock.length === 0) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // 检查股票是否已在观察列表中
    const existingStock = await db
      .select()
      .from(watchlistStocks)
      .where(and(eq(watchlistStocks.watchlistId, watchlistId), eq(watchlistStocks.stockId, stockId)))
      .limit(1);

    if (existingStock.length > 0) {
      return NextResponse.json(
        { error: 'Stock already in watchlist' },
        { status: 409 }
      );
    }

    // 添加股票到观察列表
    const [newWatchlistStock] = await db
      .insert(watchlistStocks)
      .values({
        watchlistId,
        stockId,
      })
      .returning();

    return NextResponse.json(newWatchlistStock, { status: 201 });

  } catch (error) {
    console.error('Add stock to watchlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ watchlistId: string }> }
) {
  try {
    const { watchlistId: watchlistIdStr } = await params;
    const watchlistId = parseInt(watchlistIdStr);
    const { searchParams } = new URL(request.url);
    const stockId = parseInt(searchParams.get('stockId') || '0');

    if (!stockId) {
      return NextResponse.json(
        { error: 'Stock ID is required' },
        { status: 400 }
      );
    }

    // 从观察列表中删除股票
    const deletedStock = await db
      .delete(watchlistStocks)
      .where(and(eq(watchlistStocks.watchlistId, watchlistId), eq(watchlistStocks.stockId, stockId)))
      .returning();

    if (deletedStock.length === 0) {
      return NextResponse.json(
        { error: 'Stock not found in watchlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Stock removed from watchlist' });

  } catch (error) {
    console.error('Remove stock from watchlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
