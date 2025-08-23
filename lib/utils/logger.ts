export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  userId?: number;
  sessionId?: string;
  requestId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorDetails = error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context
      } : context;
      
      console.error(this.formatMessage(LogLevel.ERROR, message, errorDetails));
    }
  }

  // 专门用于数据库操作的日志
  dbQuery(operation: string, table: string, conditions?: any, context?: LogContext) {
    this.debug(`DB Query: ${operation} on ${table}`, {
      conditions,
      ...context
    });
  }

  dbError(operation: string, table: string, error: Error, context?: LogContext) {
    this.error(`DB Error: ${operation} on ${table}`, error, {
      operation,
      table,
      ...context
    });
  }

  // 专门用于认证操作的日志
  auth(action: string, userId?: number, context?: LogContext) {
    this.info(`Auth: ${action}`, {
      userId,
      action,
      ...context
    });
  }

  authError(action: string, error: Error, context?: LogContext) {
    this.error(`Auth Error: ${action}`, error, {
      action,
      ...context
    });
  }
}

export const logger = new Logger();
