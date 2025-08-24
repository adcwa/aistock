import { RoleManagementService } from '../lib/services/role-management';
import { db } from '../lib/db/drizzle';
import { roles, permissions, rolePermissions } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function initializeRolePermissions() {
  try {
    console.log('🔧 开始初始化角色权限关联...\n');

    // 获取所有角色和权限
    const allRoles = await db.select().from(roles);
    const allPermissions = await db.select().from(permissions);

    console.log(`找到 ${allRoles.length} 个角色和 ${allPermissions.length} 个权限`);

    // 定义角色权限映射
    const rolePermissionMap = {
      admin: allPermissions.map(p => p.name), // 管理员拥有所有权限
      enterprise: [
        'stock:view', 'stock:search', 'stock:analysis',
        'ai_config:view', 'ai_config:create', 'ai_config:update', 'ai_config:delete', 'ai_analysis',
        'email_notification:view', 'email_notification:create', 'email_notification:update', 'email_notification:delete',
        'watchlist:view', 'watchlist:create', 'watchlist:update', 'watchlist:delete',
        'subscription:view', 'subscription:create', 'subscription:update', 'subscription:delete',
        'advanced_features', 'api_access', 'export_data'
      ],
      pro: [
        'stock:view', 'stock:search', 'stock:analysis',
        'ai_config:view', 'ai_config:create', 'ai_config:update', 'ai_config:delete', 'ai_analysis',
        'email_notification:view', 'email_notification:create', 'email_notification:update', 'email_notification:delete',
        'watchlist:view', 'watchlist:create', 'watchlist:update', 'watchlist:delete',
        'subscription:view'
      ],
      free: [
        'stock:view', 'stock:search',
        'watchlist:view', 'watchlist:create', 'watchlist:update', 'watchlist:delete'
      ]
    };

    // 为每个角色分配权限
    for (const role of allRoles) {
      console.log(`\n处理角色: ${role.name}`);
      
      const permissionNames = rolePermissionMap[role.name as keyof typeof rolePermissionMap] || [];
      console.log(`  需要分配的权限: ${permissionNames.length} 个`);

      if (permissionNames.length > 0) {
        // 获取权限ID
        const permissionIds = allPermissions
          .filter(p => permissionNames.includes(p.name))
          .map(p => p.id);

        console.log(`  找到 ${permissionIds.length} 个权限ID`);

        // 清除现有权限
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

        // 分配新权限
        for (const permissionId of permissionIds) {
          await db.insert(rolePermissions).values({
            roleId: role.id,
            permissionId: permissionId,
            grantedAt: new Date()
          });
        }

        console.log(`  ✅ 已为角色 ${role.name} 分配 ${permissionIds.length} 个权限`);
      }
    }

    console.log('\n🎉 角色权限初始化完成！');

    // 验证结果
    console.log('\n📊 验证结果:');
    for (const role of allRoles) {
      const rolePerms = await db
        .select({
          permissionName: permissions.name
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, role.id));

      console.log(`  ${role.name}: ${rolePerms.length} 个权限`);
    }

  } catch (error) {
    console.error('❌ 角色权限初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeRolePermissions();
