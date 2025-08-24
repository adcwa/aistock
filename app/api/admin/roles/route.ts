import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RoleManagementService } from '@/lib/services/role-management';
import { requireAdmin } from '@/lib/middleware/permission';

// 获取所有角色
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const roles = await RoleManagementService.getAllRoles();

    return NextResponse.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Failed to get roles:', error);
    return NextResponse.json(
      { error: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

// 创建新角色
export async function POST(request: NextRequest) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const session = await getSession();
    const { name, description, permissions } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: '角色名称不能为空' },
        { status: 400 }
      );
    }

    const newRole = await RoleManagementService.createRole(
      { name, description, permissions },
      session!.user!.id
    );

    return NextResponse.json({
      success: true,
      data: newRole
    });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json(
      { error: '创建角色失败' },
      { status: 500 }
    );
  }
}
