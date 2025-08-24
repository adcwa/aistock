import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db/drizzle';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    logger.info('Testing database connection via API', { 
      action: 'test_db_connection',
      nodeEnv: process.env.NODE_ENV,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      postgresUrlLength: process.env.POSTGRES_URL?.length
    });

    const isConnected = await testDatabaseConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorObj = error instanceof Error ? error : new Error(errorMessage);
    
    logger.error('Database connection test failed', errorObj, { 
      action: 'test_db_connection',
      nodeEnv: process.env.NODE_ENV,
      errorMessage
    });

    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: errorMessage,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
