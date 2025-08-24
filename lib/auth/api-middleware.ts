import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

export interface AuthenticatedRequest extends NextRequest {
  user: Awaited<ReturnType<typeof getUser>>;
}

export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }

      // 将用户信息附加到请求对象
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      return handler(authenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export function withOptionalAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getUser();
      
      // 将用户信息附加到请求对象（可能为null）
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      return handler(authenticatedRequest);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // 对于可选认证，我们仍然继续处理请求
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = null;
      
      return handler(authenticatedRequest);
    }
  };
}

// 从URL参数或请求体中获取用户ID的辅助函数
export function getUserIdFromRequest(request: AuthenticatedRequest): number {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId');
  
  if (userIdParam) {
    return parseInt(userIdParam);
  }
  
  // 如果没有URL参数，使用认证用户ID
  if (request.user) {
    return request.user.id;
  }
  
  throw new Error('No user ID found in request');
}

// 验证请求用户ID与认证用户ID是否匹配
export function validateUserAccess(request: AuthenticatedRequest, targetUserId?: number): number {
  const userId = targetUserId || getUserIdFromRequest(request);
  
  if (!request.user) {
    throw new Error('User not authenticated');
  }
  
  if (request.user.id !== userId) {
    throw new Error('Access denied - User ID mismatch');
  }
  
  return userId;
}
