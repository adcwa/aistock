import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { stripe } from '@/lib/payments/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
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

    const team = userTeam[0].team;

    // 如果没有订阅，返回基本信息
    if (!team.stripeSubscriptionId) {
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          status: 'free',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          planName: 'Free',
          tier: 'free'
        }
      });
    }

    // 获取Stripe订阅信息
    const subscription = await stripe.subscriptions.retrieve(team.stripeSubscriptionId);

    return NextResponse.json({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        planName: team.planName || 'Unknown',
        tier: team.planName?.toLowerCase() || 'free'
      }
    });

  } catch (error) {
    console.error('Subscription info error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '获取订阅信息失败' },
      { status: 500 }
    );
  }
}
