import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RoleManagementService } from '@/lib/services/role-management';

// 权限检查中间件
export async function checkPermission(
  request: NextRequest,
  requiredPermission: string,
  options: {
    allowAdmin?: boolean;
    redirectTo?: string;
    showError?: boolean;
  } = {}
) {
  const { allowAdmin = true, redirectTo, showError = true } = options;

  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      if (redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查是否为管理员
    if (allowAdmin) {
      const isAdmin = await RoleManagementService.isAdmin(session.user.id);
      if (isAdmin) {
        return NextResponse.next();
      }
    }

    // 检查特定权限
    const hasPermission = await RoleManagementService.hasPermission(
      session.user.id,
      requiredPermission
    );

    if (!hasPermission) {
      if (showError) {
        return NextResponse.json(
          { error: '权限不足' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: '功能不可用' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('权限检查失败:', error);
    return NextResponse.json(
      { error: '权限检查失败' },
      { status: 500 }
    );
  }
}

// 角色检查中间件
export async function checkRole(
  request: NextRequest,
  requiredRole: string,
  options: {
    allowAdmin?: boolean;
    redirectTo?: string;
    showError?: boolean;
  } = {}
) {
  const { allowAdmin = true, redirectTo, showError = true } = options;

  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      if (redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查是否为管理员
    if (allowAdmin) {
      const isAdmin = await RoleManagementService.isAdmin(session.user.id);
      if (isAdmin) {
        return NextResponse.next();
      }
    }

    // 检查特定角色
    const userRoles = await RoleManagementService.getUserRoles(session.user.id);
    const hasRole = userRoles.some(role => role.name === requiredRole);

    if (!hasRole) {
      if (showError) {
        return NextResponse.json(
          { error: '角色权限不足' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: '功能不可用' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('角色检查失败:', error);
    return NextResponse.json(
      { error: '角色检查失败' },
      { status: 500 }
    );
  }
}

// 权限装饰器（用于API路由）
export function requirePermission(permission: string, options = {}) {
  return async function(request: NextRequest) {
    return await checkPermission(request, permission, options);
  };
}

// 角色装饰器（用于API路由）
export function requireRole(role: string, options = {}) {
  return async function(request: NextRequest) {
    return await checkRole(request, role, options);
  };
}

// 管理员装饰器（用于API路由）
export function requireAdmin(options = {}) {
  return async function(request: NextRequest) {
    try {
      const session = await getSession();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: '未授权访问' },
          { status: 401 }
        );
      }

      const isAdmin = await RoleManagementService.isAdmin(session.user.id);
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: '需要管理员权限' },
          { status: 403 }
        );
      }

      return NextResponse.next();
    } catch (error) {
      console.error('管理员权限检查失败:', error);
      return NextResponse.json(
        { error: '权限检查失败' },
        { status: 500 }
      );
    }
  };
}
