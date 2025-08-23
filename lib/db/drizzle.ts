import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import { logger } from '@/lib/utils/logger';

dotenv.config();

const postgresUrl = process.env.POSTGRES_URL || 'postgresql://admin:Admin123@localhost:5432/aistock';

if (!postgresUrl) {
  logger.error('POSTGRES_URL environment variable is not set', null, { 
    action: 'db_connection',
    hasEnvUrl: !!process.env.POSTGRES_URL 
  });
  throw new Error('POSTGRES_URL environment variable is not set');
}

logger.info('Initializing database connection', { 
  action: 'db_connection',
  urlLength: postgresUrl.length,
  hasUrl: !!postgresUrl
});

export const client = postgres(postgresUrl, {
  onnotice: (notice) => {
    logger.debug('PostgreSQL notice', { 
      action: 'db_connection',
      notice: notice.message 
    });
  },
  onparameter: (parameterStatus) => {
    logger.debug('PostgreSQL parameter', { 
      action: 'db_connection',
      parameter: parameterStatus 
    });
  },
  onclose: () => {
    logger.warn('PostgreSQL connection closed', { action: 'db_connection' });
  },
  onerror: (error) => {
    logger.error('PostgreSQL connection error', error, { action: 'db_connection' });
  }
});

export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery(query, params) {
      logger.debug('DB Query', { 
        action: 'db_query',
        query: query.sql,
        params: params
      });
    },
    logQueryError(error, query, params) {
      logger.error('DB Query Error', error, { 
        action: 'db_query_error',
        query: query.sql,
        params: params
      });
    }
  } : false
});

logger.info('Database connection initialized successfully', { action: 'db_connection' });
