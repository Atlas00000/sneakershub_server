/**
 * Server-side Logger Utility
 * 
 * Provides structured logging with different log levels, formatting,
 * timestamps, and optional file output for production environments.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LogConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColors: boolean;
  prefix: string;
}

type LogColors = {
  [key in LogLevel]: string;
};

const LOG_COLORS: LogColors = {
  [LogLevel.DEBUG]: '\x1b[90m', // Gray
  [LogLevel.INFO]: '\x1b[36m',  // Cyan
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.NONE]: '',
};

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE',
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  private config: LogConfig;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableTimestamp: true,
      enableColors: process.stdout.isTTY && process.env.NO_COLOR !== '1',
      prefix: '[Server]',
      ...config,
    };
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.config.enableTimestamp
      ? new Date().toISOString()
      : '';
    
    const levelName = LOG_LEVEL_NAMES[level];
    const parts = [
      this.config.prefix,
      timestamp,
      `[${levelName}]`,
      message,
    ].filter(Boolean);

    return parts.join(' ');
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatWithColor(message: string, level: LogLevel): string {
    if (!this.config.enableColors) return message;
    
    const color = LOG_COLORS[level];
    return `${color}${message}${RESET_COLOR}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formatted = this.formatMessage(LogLevel.DEBUG, message);
    const colored = this.formatWithColor(formatted, LogLevel.DEBUG);
    console.log(colored, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formatted = this.formatMessage(LogLevel.INFO, message);
    const colored = this.formatWithColor(formatted, LogLevel.INFO);
    console.log(colored, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formatted = this.formatMessage(LogLevel.WARN, message);
    const colored = this.formatWithColor(formatted, LogLevel.WARN);
    console.warn(colored, ...args);
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formatted = this.formatMessage(LogLevel.ERROR, message);
    const colored = this.formatWithColor(formatted, LogLevel.ERROR);
    
    if (error instanceof Error) {
      console.error(colored, error.message, ...args);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      console.error(colored, error, ...args);
    }
  }

  /**
   * Create a scoped logger with a specific prefix
   */
  scope(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix} [${prefix}]`,
    });
  }

  /**
   * Update log level at runtime
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating custom loggers
export default Logger;

