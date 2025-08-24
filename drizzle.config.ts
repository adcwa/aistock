import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 获取并处理数据库URL
const getDatabaseUrl = () => {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.warn('POSTGRES_URL not found, using fallback');
    return 'postgresql://admin:Admin123@localhost:5432/aistock';
  }
  
  // 检查URL格式
  try {
    const urlObj = new URL(url);
    console.log('Database URL parsed successfully');
    return url;
  } catch (error) {
    console.error('Invalid database URL format:', error);
    throw new Error('Invalid database URL format');
  }
};

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
} satisfies Config;
