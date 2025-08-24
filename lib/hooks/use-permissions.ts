import { useState, useEffect } from 'react';

interface UserPermissions {
  permissions: string[];
  roles: Array<{
    id: number;
    name: string;
    description: string;
  }>;
  isAdmin: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/permissions');
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.data);
      } else {
        setError('获取权限失败');
      }
    } catch (err) {
      setError('获取权限失败');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!permissions) return false;
    if (permissions.isAdmin) return true;
    return permissions.permissions.includes(permission);
  };

  const hasRole = (roleName: string): boolean => {
    if (!permissions) return false;
    if (permissions.isAdmin) return true;
    return permissions.roles.some(role => role.name === roleName);
  };

  const isAdmin = (): boolean => {
    return permissions?.isAdmin || false;
  };

  const refreshPermissions = () => {
    loadPermissions();
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasRole,
    isAdmin,
    refreshPermissions
  };
}
