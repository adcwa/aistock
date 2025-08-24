'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Crown,
  Star,
  Zap,
  Settings
} from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  isSystem: boolean;
}

interface RoleManagementProps {
  roles: Role[];
  permissions: Permission[];
  onRoleUpdate: () => void;
}

export default function RoleManagement({ roles, permissions, onRoleUpdate }: RoleManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'enterprise':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'pro':
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateRole = async () => {
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onRoleUpdate();
        setIsCreateDialogOpen(false);
        setFormData({ name: '', description: '', permissions: [] });
      } else {
        const error = await response.json();
        alert(error.error || '创建角色失败');
      }
    } catch (error) {
      console.error('Failed to create role:', error);
      alert('创建角色失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !formData.name) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onRoleUpdate();
        setIsEditDialogOpen(false);
        setSelectedRole(null);
        setFormData({ name: '', description: '', permissions: [] });
      } else {
        const error = await response.json();
        alert(error.error || '更新角色失败');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('更新角色失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('确定要删除这个角色吗？')) return;

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRoleUpdate();
      } else {
        const error = await response.json();
        alert(error.error || '删除角色失败');
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert('删除角色失败');
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setIsEditDialogOpen(true);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }));
    }
  };

  const groupedPermissions = permissions.reduce((groups, permission) => {
    const resource = permission.resource;
    if (!groups[resource]) {
      groups[resource] = [];
    }
    groups[resource].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            角色管理
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建角色
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建新角色</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">角色名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入角色名称"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">角色描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入角色描述"
                  />
                </div>
                
                <div>
                  <Label>权限设置</Label>
                  <div className="space-y-4 mt-2">
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <div key={resource} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{resource}</h4>
                        <div className="space-y-2">
                          {perms.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`permission-${permission.id}`}
                                checked={formData.permissions.includes(permission.name)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.name, checked as boolean)
                                }
                              />
                              <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                                {permission.description || permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleCreateRole}
                    disabled={!formData.name || isSubmitting}
                  >
                    {isSubmitting ? '创建中...' : '创建角色'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getRoleIcon(role.name)}
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-sm text-gray-500">{role.description}</p>
                    <p className="text-xs text-gray-400">
                      {role.permissions?.length || 0} 个权限
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={role.isSystem ? "default" : "secondary"}>
                    {role.isSystem ? '系统' : '自定义'}
                  </Badge>
                  {!role.isSystem && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 编辑角色对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">角色名称</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入角色名称"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">角色描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入角色描述"
              />
            </div>
            
            <div>
              <Label>权限设置</Label>
              <div className="space-y-4 mt-2">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{resource}</h4>
                    <div className="space-y-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-permission-${permission.id}`}
                            checked={formData.permissions.includes(permission.name)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.name, checked as boolean)
                            }
                          />
                          <Label htmlFor={`edit-permission-${permission.id}`} className="text-sm">
                            {permission.description || permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleUpdateRole}
                disabled={!formData.name || isSubmitting}
              >
                {isSubmitting ? '更新中...' : '更新角色'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
