/**
 * Logging utility for AgriSphere Backend
 * Provides structured logging with different levels
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Simple logger implementation
 * In production, consider using winston or similar logging library
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };
    
    return JSON.stringify(logEntry);
  }

  /**
   * Write log to file and console
   */
  writeLog(level, message, data = null) {
    if (this.levels[level] > this.levels[this.logLevel]) {
      return; // Skip if log level is higher than configured level
    }

    const formattedMessage = this.formatMessage(level, message, data);
    
    // Console output with colors for development
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[35m'  // Magenta
      };
      const reset = '\x1b[0m';
      
      console.log(`${colors[level]}${formattedMessage}${reset}`);
    } else {
      console.log(formattedMessage);
    }

    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      const logFile = path.join(logsDir, `${level}.log`);
      fs.appendFileSync(logFile, formattedMessage + '\n');
    }
  }

  /**
   * Log error messages
   */
  error(message, data = null) {
    this.writeLog('error', message, data);
  }

  /**
   * Log warning messages
   */
  warn(message, data = null) {
    this.writeLog('warn', message, data);
  }

  /**
   * Log info messages
   */
  info(message, data = null) {
    this.writeLog('info', message, data);
  }

  /**
   * Log debug messages
   */
  debug(message, data = null) {
    this.writeLog('debug', message, data);
  }

  /**
   * Log HTTP requests (middleware friendly)
   */
  request(req, res, message = 'HTTP Request') {
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      responseTime: res.get('X-Response-Time')
    };
    
    this.info(message, requestData);
  }

  /**
   * Log API errors with context
   */
  apiError(error, req = null) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      ...(req && {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress
      })
    };
    
    this.error('API Error', errorData);
  }
}

// Export singleton instance
module.exports = new Logger();