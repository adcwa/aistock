import { RoleManagementService } from '../lib/services/role-management';
import { db } from '../lib/db/drizzle';
import { permissions } from '../lib/db/schema';

async function initializeSystem() {
  try {
    console.log('开始初始化系统角色和权限...');

    // 初始化系统角色
    await RoleManagementService.initializeSystemRoles();
    
    console.log('✅ 系统角色初始化完成');

    // 验证初始化结果
    const allRoles = await RoleManagementService.getAllRoles();
    console.log(`📊 已创建 ${allRoles.length} 个角色:`);
    allRoles.forEach(role => {
      console.log(`  - ${role.name}: ${role.description}`);
    });

    console.log('🎉 系统初始化完成！');
  } catch (error) {
    console.error('❌ 系统初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeSystem();
