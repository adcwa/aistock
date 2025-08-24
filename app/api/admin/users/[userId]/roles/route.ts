import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RoleManagementService } from '@/lib/services/role-management';
import { requireAdmin } from '@/lib/middleware/permission';

// 获取用户的角色
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: '无效的用户ID' },
        { status: 400 }
      );
    }

    const userRoles = await RoleManagementService.getUserRoles(userId);

    return NextResponse.json({
      success: true,
      data: userRoles
    });
  } catch (error) {
    console.error('Failed to get user roles:', error);
    return NextResponse.json(
      { error: '获取用户角色失败' },
      { status: 500 }
    );
  }
}

// 为用户分配角色
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const session = await getSession();
    const userId = parseInt(params.userId);
    const { roleId, expiresAt } = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: '无效的用户ID' },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        { error: '角色ID不能为空' },
        { status: 400 }
      );
    }

    await RoleManagementService.assignRoleToUser(
      userId,
      roleId,
      session!.user!.id,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({
      success: true,
      message: '角色分配成功'
    });
  } catch (error) {
    console.error('Failed to assign role to user:', error);
    return NextResponse.json(
      { error: '分配角色失败' },
      { status: 500 }
    );
  }
}

// 移除用户的角色
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const userId = parseInt(params.userId);
    const { roleId } = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: '无效的用户ID' },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        { error: '角色ID不能为空' },
        { status: 400 }
      );
    }

    await RoleManagementService.removeRoleFromUser(userId, roleId);

    return NextResponse.json({
      success: true,
      message: '角色移除成功'
    });
  } catch (error) {
    console.error('Failed to remove role from user:', error);
    return NextResponse.json(
      { error: '移除角色失败' },
      { status: 500 }
    );
  }
}
