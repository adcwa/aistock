import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RoleManagementService } from '@/lib/services/role-management';
import { requireAdmin } from '@/lib/middleware/permission';
import { db } from '@/lib/db/schema';
import { roles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// 获取角色详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const roleId = parseInt(params.id);
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: '无效的角色ID' },
        { status: 400 }
      );
    }

    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      return NextResponse.json(
        { error: '角色不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role[0]
    });
  } catch (error) {
    console.error('Failed to get role:', error);
    return NextResponse.json(
      { error: '获取角色详情失败' },
      { status: 500 }
    );
  }
}

// 更新角色
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const session = await getSession();
    const roleId = parseInt(params.id);
    const { name, description, permissions } = await request.json();

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: '无效的角色ID' },
        { status: 400 }
      );
    }

    const updatedRole = await RoleManagementService.updateRole(roleId, {
      name,
      description,
      permissions
    });

    return NextResponse.json({
      success: true,
      data: updatedRole
    });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json(
      { error: '更新角色失败' },
      { status: 500 }
    );
  }
}

// 删除角色
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const roleId = parseInt(params.id);
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: '无效的角色ID' },
        { status: 400 }
      );
    }

    await RoleManagementService.deleteRole(roleId);

    return NextResponse.json({
      success: true,
      message: '角色删除成功'
    });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return NextResponse.json(
      { error: '删除角色失败' },
      { status: 500 }
    );
  }
}
