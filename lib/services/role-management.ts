import { db } from '@/lib/db/drizzle';
import { roles, userRoles, permissions, rolePermissions, subscriptionConfigs } from '@/lib/db/schema';
import { eq, and, inArray, isNull, or, gte } from 'drizzle-orm';
import type { Role, UserRole, Permission, RolePermission, SubscriptionConfig } from '@/lib/db/schema';

// 系统内置角色
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const;

// 系统内置权限
export const SYSTEM_PERMISSIONS = {
  // 用户管理
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // 角色管理
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',
  
  // 权限管理
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_GRANT: 'permission:grant',
  PERMISSION_REVOKE: 'permission:revoke',
  
  // 订阅管理
  SUBSCRIPTION_VIEW: 'subscription:view',
  SUBSCRIPTION_CREATE: 'subscription:create',
  SUBSCRIPTION_UPDATE: 'subscription:update',
  SUBSCRIPTION_DELETE: 'subscription:delete',
  
  // 股票功能
  STOCK_VIEW: 'stock:view',
  STOCK_SEARCH: 'stock:search',
  STOCK_ANALYSIS: 'stock:analysis',
  
  // AI功能
  AI_CONFIG_VIEW: 'ai_config:view',
  AI_CONFIG_CREATE: 'ai_config:create',
  AI_CONFIG_UPDATE: 'ai_config:update',
  AI_CONFIG_DELETE: 'ai_config:delete',
  AI_ANALYSIS: 'ai_analysis',
  
  // 邮件功能
  EMAIL_NOTIFICATION_VIEW: 'email_notification:view',
  EMAIL_NOTIFICATION_CREATE: 'email_notification:create',
  EMAIL_NOTIFICATION_UPDATE: 'email_notification:update',
  EMAIL_NOTIFICATION_DELETE: 'email_notification:delete',
  
  // 观察列表
  WATCHLIST_VIEW: 'watchlist:view',
  WATCHLIST_CREATE: 'watchlist:create',
  WATCHLIST_UPDATE: 'watchlist:update',
  WATCHLIST_DELETE: 'watchlist:delete',
  
  // 高级功能
  ADVANCED_FEATURES: 'advanced_features',
  API_ACCESS: 'api_access',
  EXPORT_DATA: 'export_data',
} as const;

export class RoleManagementService {
  // 初始化系统角色和权限
  static async initializeSystemRoles(): Promise<void> {
    try {
      // 首先创建系统权限
      const systemPermissions = [
        // 用户管理
        { name: SYSTEM_PERMISSIONS.USER_VIEW, description: '查看用户信息', resource: 'user', action: 'view' },
        { name: SYSTEM_PERMISSIONS.USER_CREATE, description: '创建用户', resource: 'user', action: 'create' },
        { name: SYSTEM_PERMISSIONS.USER_UPDATE, description: '更新用户信息', resource: 'user', action: 'update' },
        { name: SYSTEM_PERMISSIONS.USER_DELETE, description: '删除用户', resource: 'user', action: 'delete' },
        
        // 角色管理
        { name: SYSTEM_PERMISSIONS.ROLE_VIEW, description: '查看角色', resource: 'role', action: 'view' },
        { name: SYSTEM_PERMISSIONS.ROLE_CREATE, description: '创建角色', resource: 'role', action: 'create' },
        { name: SYSTEM_PERMISSIONS.ROLE_UPDATE, description: '更新角色', resource: 'role', action: 'update' },
        { name: SYSTEM_PERMISSIONS.ROLE_DELETE, description: '删除角色', resource: 'role', action: 'delete' },
        { name: SYSTEM_PERMISSIONS.ROLE_ASSIGN, description: '分配角色', resource: 'role', action: 'assign' },
        
        // 权限管理
        { name: SYSTEM_PERMISSIONS.PERMISSION_VIEW, description: '查看权限', resource: 'permission', action: 'view' },
        { name: SYSTEM_PERMISSIONS.PERMISSION_GRANT, description: '授予权限', resource: 'permission', action: 'grant' },
        { name: SYSTEM_PERMISSIONS.PERMISSION_REVOKE, description: '撤销权限', resource: 'permission', action: 'revoke' },
        
        // 订阅管理
        { name: SYSTEM_PERMISSIONS.SUBSCRIPTION_VIEW, description: '查看订阅', resource: 'subscription', action: 'view' },
        { name: SYSTEM_PERMISSIONS.SUBSCRIPTION_CREATE, description: '创建订阅', resource: 'subscription', action: 'create' },
        { name: SYSTEM_PERMISSIONS.SUBSCRIPTION_UPDATE, description: '更新订阅', resource: 'subscription', action: 'update' },
        { name: SYSTEM_PERMISSIONS.SUBSCRIPTION_DELETE, description: '删除订阅', resource: 'subscription', action: 'delete' },
        
        // 股票功能
        { name: SYSTEM_PERMISSIONS.STOCK_VIEW, description: '查看股票信息', resource: 'stock', action: 'view' },
        { name: SYSTEM_PERMISSIONS.STOCK_SEARCH, description: '搜索股票', resource: 'stock', action: 'search' },
        { name: SYSTEM_PERMISSIONS.STOCK_ANALYSIS, description: '股票分析', resource: 'stock', action: 'analysis' },
        
        // AI功能
        { name: SYSTEM_PERMISSIONS.AI_CONFIG_VIEW, description: '查看AI配置', resource: 'ai_config', action: 'view' },
        { name: SYSTEM_PERMISSIONS.AI_CONFIG_CREATE, description: '创建AI配置', resource: 'ai_config', action: 'create' },
        { name: SYSTEM_PERMISSIONS.AI_CONFIG_UPDATE, description: '更新AI配置', resource: 'ai_config', action: 'update' },
        { name: SYSTEM_PERMISSIONS.AI_CONFIG_DELETE, description: '删除AI配置', resource: 'ai_config', action: 'delete' },
        { name: SYSTEM_PERMISSIONS.AI_ANALYSIS, description: 'AI分析', resource: 'ai_analysis', action: 'execute' },
        
        // 邮件功能
        { name: SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_VIEW, description: '查看邮件通知', resource: 'email_notification', action: 'view' },
        { name: SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_CREATE, description: '创建邮件通知', resource: 'email_notification', action: 'create' },
        { name: SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_UPDATE, description: '更新邮件通知', resource: 'email_notification', action: 'update' },
        { name: SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_DELETE, description: '删除邮件通知', resource: 'email_notification', action: 'delete' },
        
        // 观察列表
        { name: SYSTEM_PERMISSIONS.WATCHLIST_VIEW, description: '查看观察列表', resource: 'watchlist', action: 'view' },
        { name: SYSTEM_PERMISSIONS.WATCHLIST_CREATE, description: '创建观察列表', resource: 'watchlist', action: 'create' },
        { name: SYSTEM_PERMISSIONS.WATCHLIST_UPDATE, description: '更新观察列表', resource: 'watchlist', action: 'update' },
        { name: SYSTEM_PERMISSIONS.WATCHLIST_DELETE, description: '删除观察列表', resource: 'watchlist', action: 'delete' },
        
        // 高级功能
        { name: SYSTEM_PERMISSIONS.ADVANCED_FEATURES, description: '高级功能', resource: 'advanced', action: 'access' },
        { name: SYSTEM_PERMISSIONS.API_ACCESS, description: 'API访问', resource: 'api', action: 'access' },
        { name: SYSTEM_PERMISSIONS.EXPORT_DATA, description: '导出数据', resource: 'data', action: 'export' },
      ];

      // 创建权限
      for (const permData of systemPermissions) {
        const existingPermission = await db
          .select()
          .from(permissions)
          .where(eq(permissions.name, permData.name))
          .limit(1);

        if (existingPermission.length === 0) {
          await db
            .insert(permissions)
            .values({
              name: permData.name,
              description: permData.description,
              resource: permData.resource,
              action: permData.action,
              isSystem: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
        }
      }

      console.log(`✅ 已创建 ${systemPermissions.length} 个系统权限`);

      // 创建系统角色
      const systemRoles = [
        {
          name: SYSTEM_ROLES.ADMIN,
          description: '系统管理员，拥有所有权限',
          isSystem: true,
          permissions: Object.values(SYSTEM_PERMISSIONS)
        },
        {
          name: SYSTEM_ROLES.FREE,
          description: '免费用户，基础功能权限',
          isSystem: true,
          permissions: [
            SYSTEM_PERMISSIONS.STOCK_VIEW,
            SYSTEM_PERMISSIONS.STOCK_SEARCH,
            SYSTEM_PERMISSIONS.WATCHLIST_VIEW,
            SYSTEM_PERMISSIONS.WATCHLIST_CREATE,
            SYSTEM_PERMISSIONS.WATCHLIST_UPDATE,
            SYSTEM_PERMISSIONS.WATCHLIST_DELETE,
          ]
        },
        {
          name: SYSTEM_ROLES.PRO,
          description: '专业用户，完整功能权限',
          isSystem: true,
          permissions: [
            SYSTEM_PERMISSIONS.STOCK_VIEW,
            SYSTEM_PERMISSIONS.STOCK_SEARCH,
            SYSTEM_PERMISSIONS.STOCK_ANALYSIS,
            SYSTEM_PERMISSIONS.AI_CONFIG_VIEW,
            SYSTEM_PERMISSIONS.AI_CONFIG_CREATE,
            SYSTEM_PERMISSIONS.AI_CONFIG_UPDATE,
            SYSTEM_PERMISSIONS.AI_CONFIG_DELETE,
            SYSTEM_PERMISSIONS.AI_ANALYSIS,
            SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_VIEW,
            SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_CREATE,
            SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_UPDATE,
            SYSTEM_PERMISSIONS.EMAIL_NOTIFICATION_DELETE,
            SYSTEM_PERMISSIONS.WATCHLIST_VIEW,
            SYSTEM_PERMISSIONS.WATCHLIST_CREATE,
            SYSTEM_PERMISSIONS.WATCHLIST_UPDATE,
            SYSTEM_PERMISSIONS.WATCHLIST_DELETE,
          ]
        },
        {
          name: SYSTEM_ROLES.ENTERPRISE,
          description: '企业用户，高级功能权限',
          isSystem: true,
          permissions: Object.values(SYSTEM_PERMISSIONS)
        }
      ];

      for (const roleData of systemRoles) {
        const existingRole = await db
          .select()
          .from(roles)
          .where(eq(roles.name, roleData.name))
          .limit(1);

        if (existingRole.length === 0) {
          const [newRole] = await db
            .insert(roles)
            .values({
              name: roleData.name,
              description: roleData.description,
              permissions: roleData.permissions,
              isSystem: roleData.isSystem,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          // 为角色分配权限
          if (roleData.permissions && roleData.permissions.length > 0) {
            await this.assignPermissionsToRole(newRole.id, roleData.permissions);
          }
        }
      }

      console.log('系统角色初始化完成');
    } catch (error) {
      console.error('初始化系统角色失败:', error);
      throw error;
    }
  }

  // 获取用户的所有角色
  static async getUserRoles(userId: number): Promise<Role[]> {
    const userRoleData = await db
      .select({
        role: roles
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(
        eq(userRoles.userId, userId),
        or(
          isNull(userRoles.expiresAt),
          gte(userRoles.expiresAt, new Date())
        )
      ));

    return userRoleData.map(ur => ur.role);
  }

  // 获取用户的所有权限
  static async getUserPermissions(userId: number): Promise<string[]> {
    const userPermissions = await db
      .select({
        permissionName: permissions.name
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(
        eq(userRoles.userId, userId),
        or(
          isNull(userRoles.expiresAt),
          gte(userRoles.expiresAt, new Date())
        )
      ));

    return [...new Set(userPermissions.map(up => up.permissionName))];
  }

  // 检查用户是否有特定权限
  static async hasPermission(userId: number, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(permission);
  }

  // 检查用户是否有管理员权限
  static async isAdmin(userId: number): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some(role => role.name === SYSTEM_ROLES.ADMIN);
  }

  // 为用户分配角色
  static async assignRoleToUser(
    userId: number, 
    roleId: number, 
    assignedBy: number,
    expiresAt?: Date
  ): Promise<void> {
    // 检查是否已存在相同的角色分配
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ))
      .limit(1);

    if (existingRole.length > 0) {
      // 更新现有分配
      await db
        .update(userRoles)
        .set({
          assignedBy,
          assignedAt: new Date(),
          expiresAt
        })
        .where(eq(userRoles.id, existingRole[0].id));
    } else {
      // 创建新分配
      await db
        .insert(userRoles)
        .values({
          userId,
          roleId,
          assignedBy,
          assignedAt: new Date(),
          expiresAt
        });
    }
  }

  // 移除用户的角色
  static async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ));
  }

  // 为角色分配权限
  static async assignPermissionsToRole(roleId: number, permissionNames: string[]): Promise<void> {
    // 获取权限ID
    const permissionData = await db
      .select()
      .from(permissions)
      .where(inArray(permissions.name, permissionNames));

    // 为角色分配权限
    for (const permission of permissionData) {
      const existingPermission = await db
        .select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permission.id)
        ))
        .limit(1);

      if (existingPermission.length === 0) {
        await db
          .insert(rolePermissions)
          .values({
            roleId,
            permissionId: permission.id,
            grantedAt: new Date()
          });
      }
    }
  }

  // 从角色移除权限
  static async removePermissionsFromRole(roleId: number, permissionNames: string[]): Promise<void> {
    const permissionData = await db
      .select()
      .from(permissions)
      .where(inArray(permissions.name, permissionNames));

    const permissionIds = permissionData.map(p => p.id);

    await db
      .delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        inArray(rolePermissions.permissionId, permissionIds)
      ));
  }

  // 获取所有角色
  static async getAllRoles(): Promise<Role[]> {
    return await db
      .select()
      .from(roles)
      .orderBy(roles.name);
  }

  // 获取所有权限
  static async getAllPermissions(): Promise<Permission[]> {
    return await db
      .select()
      .from(permissions)
      .orderBy(permissions.name);
  }

  // 创建新角色
  static async createRole(roleData: {
    name: string;
    description?: string;
    permissions?: string[];
  }, createdBy: number): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions || [],
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (roleData.permissions && roleData.permissions.length > 0) {
      await this.assignPermissionsToRole(newRole.id, roleData.permissions);
    }

    return newRole;
  }

  // 更新角色
  static async updateRole(
    roleId: number, 
    roleData: {
      name?: string;
      description?: string;
      permissions?: string[];
    }
  ): Promise<Role> {
    const [updatedRole] = await db
      .update(roles)
      .set({
        ...roleData,
        updatedAt: new Date()
      })
      .where(eq(roles.id, roleId))
      .returning();

    if (roleData.permissions) {
      // 先移除所有权限，再重新分配
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      if (roleData.permissions.length > 0) {
        await this.assignPermissionsToRole(roleId, roleData.permissions);
      }
    }

    return updatedRole;
  }

  // 删除角色
  static async deleteRole(roleId: number): Promise<void> {
    // 检查是否为系统角色
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (role.length === 0) {
      throw new Error('角色不存在');
    }

    if (role[0].isSystem) {
      throw new Error('不能删除系统角色');
    }

    // 删除角色权限关联
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // 删除用户角色关联
    await db
      .delete(userRoles)
      .where(eq(userRoles.roleId, roleId));

    // 删除角色
    await db
      .delete(roles)
      .where(eq(roles.id, roleId));
  }
}
