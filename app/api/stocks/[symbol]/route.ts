import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { stocks } from '@/lib/db/schema';
import { AlphaVantageService } from '@/lib/services/alpha-vantage';
import { eq } from 'drizzle-orm';

const alphaVantageService = new AlphaVantageService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const symbolUpper = symbol.toUpperCase();

    // 从数据库获取股票信息
    const stock = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbolUpper))
      .limit(1);

    if (stock.length > 0) {
      return NextResponse.json(stock[0]);
    }

    // 如果数据库中没有，从API获取
    try {
      const apiStock = await alphaVantageService.getStockOverview(symbolUpper);
      
      if (apiStock) {
        // 保存到数据库
        const [newStock] = await db
          .insert(stocks)
          .values({
            symbol: apiStock.symbol.toUpperCase(),
            companyName: apiStock.companyName,
            sector: apiStock.sector,
            industry: apiStock.industry,
            marketCap: apiStock.marketCap,
          })
          .returning();

        return NextResponse.json(newStock);
      }
    } catch (apiError) {
      console.error('Alpha Vantage API error:', apiError);
    }

    return NextResponse.json(
      { error: 'Stock not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Get stock error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
