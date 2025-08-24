import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RoleManagementService } from '@/lib/services/role-management';
import { requireAdmin } from '@/lib/middleware/permission';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    // 获取所有用户
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .orderBy(users.createdAt);

    // 为每个用户获取角色信息
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const userRoles = await RoleManagementService.getUserRoles(user.id);
        return {
          ...user,
          roles: userRoles
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithRoles
    });
  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}
