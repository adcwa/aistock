import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { stocks, stockPrices } from '@/lib/db/schema';
import { AlphaVantageService } from '@/lib/services/alpha-vantage';
import { eq, desc, and, gte } from 'drizzle-orm';

const alphaVantageService = new AlphaVantageService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { symbol } = await params;
    const symbolUpper = symbol.toUpperCase();
    const interval = searchParams.get('interval') || '1d';
    const limit = parseInt(searchParams.get('limit') || '100');
    const from = searchParams.get('from');

    // 首先检查股票是否存在
    const stock = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbolUpper))
      .limit(1);

    if (stock.length === 0) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    const stockId = stock[0].id;

    // 构建查询条件
    let whereConditions = [eq(stockPrices.stockId, stockId), eq(stockPrices.interval, interval)];
    
    if (from) {
      whereConditions.push(gte(stockPrices.timestamp, new Date(from)));
    }

    // 从数据库获取价格数据
    const prices = await db
      .select()
      .from(stockPrices)
      .where(and(...whereConditions))
      .orderBy(desc(stockPrices.timestamp))
      .limit(limit);

    // 如果数据库中没有足够的数据，从API获取
    if (prices.length < limit) {
      try {
        const apiInterval = interval === '1d' ? 'daily' : interval === '1w' ? 'weekly' : 'monthly';
        const apiPrices = await alphaVantageService.getHistoricalPrices(symbolUpper, apiInterval);

        if (apiPrices.length > 0) {
          // 过滤掉已存在的价格数据
          const existingTimestamps = new Set(prices.map(p => p.timestamp.getTime()));
          const newPrices = apiPrices.filter(p => !existingTimestamps.has(p.timestamp.getTime()));

          // 保存新价格数据到数据库
          if (newPrices.length > 0) {
            const pricesToInsert = newPrices.map(price => ({
              stockId,
              timestamp: price.timestamp,
              open: price.open.toString(),
              high: price.high.toString(),
              low: price.low.toString(),
              close: price.close.toString(),
              volume: price.volume,
              interval: price.interval,
            }));

            await db.insert(stockPrices).values(pricesToInsert);

            // 重新查询以获取完整数据
            const allPrices = await db
              .select()
              .from(stockPrices)
              .where(and(...whereConditions))
              .orderBy(desc(stockPrices.timestamp))
              .limit(limit);

            return NextResponse.json({
              prices: allPrices,
              total: allPrices.length,
              source: 'database_and_api'
            });
          }
        }
      } catch (apiError) {
        console.error('Alpha Vantage API error:', apiError);
      }
    }

    return NextResponse.json({
      prices: prices.reverse(), // 按时间正序返回
      total: prices.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Get stock prices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
