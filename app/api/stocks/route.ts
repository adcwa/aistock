import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { stocks } from '@/lib/db/schema';
import { AlphaVantageService } from '@/lib/services/alpha-vantage';
import { eq, ilike, or } from 'drizzle-orm';

const alphaVantageService = new AlphaVantageService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // 首先从数据库搜索
    const dbResults = await db
      .select()
      .from(stocks)
      .where(
        or(
          ilike(stocks.symbol, `%${query}%`),
          ilike(stocks.companyName, `%${query}%`)
        )
      )
      .limit(limit);

    // 如果数据库结果不足，从Alpha Vantage搜索
    if (dbResults.length < limit) {
      try {
        const apiResults = await alphaVantageService.searchStocks(query);
        
        // 过滤掉已存在的股票
        const existingSymbols = new Set(dbResults.map(stock => stock.symbol));
        const newStocks = apiResults.filter(stock => !existingSymbols.has(stock.symbol));

        // 将新股票保存到数据库
        if (newStocks.length > 0) {
          const stocksToInsert = newStocks.slice(0, limit - dbResults.length).map(stock => ({
            symbol: stock.symbol,
            companyName: stock.companyName,
            sector: stock.sector,
            industry: stock.industry,
            marketCap: stock.marketCap,
          }));

          await db.insert(stocks).values(stocksToInsert);
          
          // 重新查询以获取完整数据
          const allResults = await db
            .select()
            .from(stocks)
            .where(
              or(
                ilike(stocks.symbol, `%${query}%`),
                ilike(stocks.companyName, `%${query}%`)
              )
            )
            .limit(limit);

          return NextResponse.json({
            stocks: allResults,
            total: allResults.length,
            source: 'database_and_api'
          });
        }
      } catch (apiError) {
        console.error('Alpha Vantage API error:', apiError);
        // 如果API调用失败，只返回数据库结果
      }
    }

    return NextResponse.json({
      stocks: dbResults,
      total: dbResults.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, companyName, sector, industry, marketCap } = body;

    if (!symbol || !companyName) {
      return NextResponse.json(
        { error: 'Symbol and company name are required' },
        { status: 400 }
      );
    }

    // 检查股票是否已存在
    const existingStock = await db
      .select()
      .from(stocks)
      .where(eq(stocks.symbol, symbol.toUpperCase()))
      .limit(1);

    if (existingStock.length > 0) {
      return NextResponse.json(
        { error: 'Stock already exists' },
        { status: 409 }
      );
    }

    // 插入新股票
    const [newStock] = await db
      .insert(stocks)
      .values({
        symbol: symbol.toUpperCase(),
        companyName,
        sector,
        industry,
        marketCap,
      })
      .returning();

    return NextResponse.json(newStock, { status: 201 });

  } catch (error) {
    console.error('Create stock error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
