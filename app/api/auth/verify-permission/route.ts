import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RoleManagementService } from '@/lib/services/role-management';

// 验证用户是否有特定权限
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { permission } = await request.json();

    if (!permission) {
      return NextResponse.json(
        { error: '权限参数不能为空' },
        { status: 400 }
      );
    }

    const hasPermission = await RoleManagementService.hasPermission(session.user.id, permission);

    return NextResponse.json({
      success: true,
      data: {
        hasPermission,
        permission
      }
    });
  } catch (error) {
    console.error('Failed to verify permission:', error);
    return NextResponse.json(
      { error: '权限验证失败' },
      { status: 500 }
    );
  }
}
