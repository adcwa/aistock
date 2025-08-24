import { NextRequest, NextResponse } from 'next/server';
import { RoleManagementService } from '@/lib/services/role-management';
import { requireAdmin } from '@/lib/middleware/permission';

// 获取所有权限
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const adminCheck = await requireAdmin()(request);
    if (adminCheck.status !== 200) {
      return adminCheck;
    }

    const permissions = await RoleManagementService.getAllPermissions();

    return NextResponse.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Failed to get permissions:', error);
    return NextResponse.json(
      { error: '获取权限列表失败' },
      { status: 500 }
    );
  }
}
