import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function createTables() {
  try {
    console.log('开始创建数据库表...');

    // 创建权限表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        route VARCHAR(200),
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ 权限表创建完成');

    // 创建角色表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ 角色表创建完成');

    // 创建角色权限关联表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        granted_by INTEGER,
        granted_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE NO ACTION
      );
    `);
    console.log('✅ 角色权限关联表创建完成');

    // 创建用户角色关联表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        assigned_by INTEGER,
        assigned_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE NO ACTION
      );
    `);
    console.log('✅ 用户角色关联表创建完成');

    // 创建订阅配置表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_configs (
        id SERIAL PRIMARY KEY,
        tier VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        daily_queries INTEGER DEFAULT 50 NOT NULL,
        ai_analysis_per_day INTEGER DEFAULT 10 NOT NULL,
        watchlist_limit INTEGER DEFAULT 5 NOT NULL,
        email_notifications BOOLEAN DEFAULT false,
        custom_ai_config BOOLEAN DEFAULT false,
        advanced_features BOOLEAN DEFAULT false,
        price NUMERIC(10,2) DEFAULT '0.00',
        currency VARCHAR(3) DEFAULT 'USD',
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        updated_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE NO ACTION
      );
    `);
    console.log('✅ 订阅配置表创建完成');

    console.log('🎉 所有表创建完成！');
  } catch (error) {
    console.error('❌ 创建表失败:', error);
    process.exit(1);
  }
}

// 运行创建表脚本
createTables();
