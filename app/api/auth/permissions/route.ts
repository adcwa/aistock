import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RoleManagementService } from '@/lib/services/role-management';

// 获取当前用户的权限
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const userPermissions = await RoleManagementService.getUserPermissions(session.user.id);
    const userRoles = await RoleManagementService.getUserRoles(session.user.id);
    const isAdmin = await RoleManagementService.isAdmin(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        permissions: userPermissions,
        roles: userRoles,
        isAdmin
      }
    });
  } catch (error) {
    console.error('Failed to get user permissions:', error);
    return NextResponse.json(
      { error: '获取用户权限失败' },
      { status: 500 }
    );
  }
}
