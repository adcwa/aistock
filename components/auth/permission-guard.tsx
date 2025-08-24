'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/hooks/use-permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function PermissionGuard({ 
  children, 
  permission, 
  role, 
  fallback = null,
  showFallback = true 
}: PermissionGuardProps) {
  const { hasPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return <div className="animate-pulse">加载中...</div>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (role) {
    hasAccess = hasRole(role);
  } else {
    hasAccess = true; // 如果没有指定权限或角色，默认显示
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return showFallback ? <>{fallback}</> : null;
}

// 权限按钮组件
interface PermissionButtonProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PermissionButton({ 
  children, 
  permission, 
  role, 
  disabled = false,
  onClick,
  className = '',
  variant = 'default',
  size = 'default'
}: PermissionButtonProps) {
  const { hasPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return <button className={`btn btn-${variant} btn-${size} ${className}`} disabled>加载中...</button>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (role) {
    hasAccess = hasRole(role);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// 权限链接组件
interface PermissionLinkProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  href: string;
  className?: string;
}

export function PermissionLink({ 
  children, 
  permission, 
  role, 
  href,
  className = ''
}: PermissionLinkProps) {
  const { hasPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return <span className={`link ${className}`}>加载中...</span>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (role) {
    hasAccess = hasRole(role);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <a href={href} className={`link ${className}`}>
      {children}
    </a>
  );
}
