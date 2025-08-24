import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import { logger } from '@/lib/utils/logger';

dotenv.config();

const postgresUrl = process.env.POSTGRES_URL || 'postgresql://admin:Admin123@localhost:5432/aistock';

if (!postgresUrl) {
  logger.error('POSTGRES_URL environment variable is not set', new Error('POSTGRES_URL not set'), { 
    action: 'db_connection',
    hasEnvUrl: !!process.env.POSTGRES_URL 
  });
  throw new Error('POSTGRES_URL environment variable is not set');
}

logger.info('Initializing database connection', { 
  action: 'db_connection',
  urlLength: postgresUrl.length,
  hasUrl: !!postgresUrl,
  nodeEnv: process.env.NODE_ENV
});

// 添加连接配置选项
const connectionConfig = {
  max: 10, // 最大连接数
  idle_timeout: 20, // 空闲超时
  connect_timeout: 30, // 增加连接超时时间
  retry: 3, // 重试次数
  retry_delay: 1000, // 重试延迟（毫秒）
  onnotice: (notice: any) => {
    logger.debug('PostgreSQL notice', { 
      action: 'db_connection',
      notice: notice.message 
    });
  },
  onparameter: (parameterStatus: any) => {
    logger.debug('PostgreSQL parameter', { 
      action: 'db_connection',
      parameter: parameterStatus 
    });
  },
  onclose: () => {
    logger.warn('PostgreSQL connection closed', { action: 'db_connection' });
  },
  onerror: (error: any) => {
    logger.error('PostgreSQL connection error', error, { action: 'db_connection' });
  }
};

export const client = postgres(postgresUrl, connectionConfig);

export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

logger.info('Database connection initialized successfully', { action: 'db_connection' });

// 添加连接测试函数
export async function testDatabaseConnection() {
  try {
    const result = await db.execute('SELECT NOW() as current_time');
    logger.info('Database connection test successful', { 
      action: 'test_connection',
      timestamp: result[0]?.current_time 
    });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error instanceof Error ? error : new Error('Unknown error'), { 
      action: 'test_connection' 
    });
    return false;
  }
}
