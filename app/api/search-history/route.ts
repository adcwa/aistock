import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { searchHistory } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 获取用户的搜索历史
    const userSearchHistory = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.searchedAt))
      .limit(limit);

    return NextResponse.json(userSearchHistory);

  } catch (error) {
    console.error('Get search history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, symbol, companyName } = body;

    if (!userId || !symbol) {
      return NextResponse.json(
        { error: 'User ID and symbol are required' },
        { status: 400 }
      );
    }

    // 检查是否已存在相同的搜索记录
    const existingRecord = await db
      .select()
      .from(searchHistory)
      .where(and(eq(searchHistory.userId, userId), eq(searchHistory.symbol, symbol)))
      .limit(1);

    if (existingRecord.length > 0) {
      // 更新现有记录的搜索时间
      const [updatedRecord] = await db
        .update(searchHistory)
        .set({ searchedAt: new Date() })
        .where(eq(searchHistory.id, existingRecord[0].id))
        .returning();

      return NextResponse.json(updatedRecord);
    } else {
      // 创建新的搜索记录
      const [newRecord] = await db
        .insert(searchHistory)
        .values({
          userId,
          symbol,
          companyName: companyName || symbol,
        })
        .returning();

      return NextResponse.json(newRecord, { status: 201 });
    }

  } catch (error) {
    console.error('Create search history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const recordId = parseInt(searchParams.get('id') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (recordId) {
      // 删除特定的搜索记录
      const deletedRecord = await db
        .delete(searchHistory)
        .where(and(eq(searchHistory.id, recordId), eq(searchHistory.userId, userId)))
        .returning();

      if (deletedRecord.length === 0) {
        return NextResponse.json(
          { error: 'Search history record not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Search history record deleted' });
    } else {
      // 删除用户的所有搜索历史
      await db
        .delete(searchHistory)
        .where(eq(searchHistory.userId, userId));

      return NextResponse.json({ message: 'All search history cleared' });
    }

  } catch (error) {
    console.error('Delete search history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
