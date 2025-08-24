'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Crown,
  Star,
  Zap,
  Calendar
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

interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

interface UserRoleManagementProps {
  users: User[];
  roles: Role[];
  onUserUpdate: () => void;
}

export default function UserRoleManagement({ users, roles, onUserUpdate }: UserRoleManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    setIsAssigning(true);
    try {
      const role = roles.find(r => r.name === selectedRole);
      if (!role) throw new Error('角色不存在');

      const response = await fetch(`/api/admin/users/${selectedUser.id}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: role.id,
          expiresAt: expiresAt || null,
        }),
      });

      if (response.ok) {
        onUserUpdate();
        setSelectedRole('');
        setExpiresAt('');
      } else {
        const error = await response.json();
        alert(error.error || '分配角色失败');
      }
    } catch (error) {
      console.error('Failed to assign role:', error);
      alert('分配角色失败');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId }),
      });

      if (response.ok) {
        onUserUpdate();
      } else {
        const error = await response.json();
        alert(error.error || '移除角色失败');
      }
    } catch (error) {
      console.error('Failed to remove role:', error);
      alert('移除角色失败');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户角色管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="font-medium">
                      {user.name?.charAt(0) || user.email.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name || '未设置姓名'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      注册时间: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role.id} className={getRoleColor(role.name)}>
                        {getRoleIcon(role.name)}
                        <span className="ml-1">{role.name}</span>
                        <button
                          onClick={() => handleRemoveRole(user.id, role.id)}
                          disabled={isRemoving}
                          className="ml-1 hover:text-red-600"
                        >
                          <UserX className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        分配角色
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>为用户 {user.name || user.email} 分配角色</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="role">选择角色</Label>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择要分配的角色" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  <div className="flex items-center gap-2">
                                    {getRoleIcon(role.name)}
                                    <span>{role.name}</span>
                                    <span className="text-gray-500">({role.description})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="expiresAt">过期时间（可选）</Label>
                          <Input
                            id="expiresAt"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            placeholder="留空表示永不过期"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={handleAssignRole}
                            disabled={!selectedRole || isAssigning}
                          >
                            {isAssigning ? '分配中...' : '分配角色'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
