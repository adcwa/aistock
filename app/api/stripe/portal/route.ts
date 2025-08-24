import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/payments/stripe';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json(
        { error: '缺少返回URL' },
        { status: 400 }
      );
    }

    // 获取用户的团队
    const userTeam = await db
      .select({
        teamId: teamMembers.teamId,
        team: teams
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(
        eq(teamMembers.userId, session.user.id),
        eq(teamMembers.role, 'owner')
      ))
      .limit(1);

    if (userTeam.length === 0) {
      return NextResponse.json(
        { error: '未找到用户团队' },
        { status: 404 }
      );
    }

    const teamId = userTeam[0].teamId;

    // 创建客户门户会话
    const portalSession = await createCustomerPortalSession(teamId, returnUrl);

    return NextResponse.json({
      success: true,
      url: portalSession.url
    });

  } catch (error) {
    console.error('Portal session error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '创建客户门户会话失败' },
      { status: 500 }
    );
  }
}
