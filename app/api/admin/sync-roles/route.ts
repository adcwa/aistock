import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { SubscriptionService } from '@/lib/services/subscription';
import { RoleManagementService } from '@/lib/services/role-management';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SubscriptionTier } from '@/lib/types/subscription';

// 同步所有用户的角色和订阅计划
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查是否是管理员
    const isAdmin = await RoleManagementService.isAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, subscriptionTier } = body;

    if (userId && subscriptionTier) {
      // 同步单个用户
      await SubscriptionService.syncUserRoleAndSubscription(userId, subscriptionTier as SubscriptionTier);
      
      return NextResponse.json({
        success: true,
        message: `用户 ${userId} 的角色已同步到 ${subscriptionTier}`
      });
    } else {
      // 同步所有用户
      const allUsers = await db.select().from(users);
      let syncedCount = 0;
      let errorCount = 0;

      for (const user of allUsers) {
        try {
          // 获取用户的订阅级别
          const tier = await SubscriptionService.getUserTier(user.id);
          await SubscriptionService.syncUserRoleAndSubscription(user.id, tier);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync user ${user.id}:`, error);
          errorCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `同步完成：成功 ${syncedCount} 个用户，失败 ${errorCount} 个用户`
      });
    }
  } catch (error) {
    console.error('Failed to sync roles:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '同步角色失败' },
      { status: 500 }
    );
  }
}

// 获取同步状态
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查是否是管理员
    const isAdmin = await RoleManagementService.isAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // 获取单个用户的同步状态
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      const userRoles = await RoleManagementService.getUserRoles(parseInt(userId));
      const tier = await SubscriptionService.getUserTier(parseInt(userId));

      return NextResponse.json({
        success: true,
        data: {
          user: user[0],
          roles: userRoles,
          subscriptionTier: tier
        }
      });
    } else {
      // 获取所有用户的同步状态概览
      const allUsers = await db.select().from(users);
      const syncStatus = [];

      for (const user of allUsers) {
        try {
          const userRoles = await RoleManagementService.getUserRoles(user.id);
          const tier = await SubscriptionService.getUserTier(user.id);
          
          syncStatus.push({
            userId: user.id,
            email: user.email,
            name: user.name,
            roles: userRoles.map(role => role.name),
            subscriptionTier: tier,
            isAdmin: userRoles.some(role => role.name === 'admin')
          });
        } catch (error) {
          console.error(`Failed to get status for user ${user.id}:`, error);
          syncStatus.push({
            userId: user.id,
            email: user.email,
            name: user.name,
            roles: [],
            subscriptionTier: 'FREE',
            isAdmin: false,
            error: '获取状态失败'
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: syncStatus
      });
    }
  } catch (error) {
    console.error('Failed to get sync status:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '获取同步状态失败' },
      { status: 500 }
    );
  }
}
