/**
 * Logger utility for mobile app
 * Replaces console.log/error/warn with a structured logging system
 * Integrates with Sentry for production error tracking
 */

import { captureException, captureMessage } from './sentry'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development'
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined

    const sanitized: LogContext = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'auth']

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const sanitizedContext = this.sanitizeContext(context)
      const formatted = this.formatMessage('debug', message, sanitizedContext)
      console.log(formatted)
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const sanitizedContext = this.sanitizeContext(context)
      const formatted = this.formatMessage('info', message, sanitizedContext)
      console.log(formatted)
    }
    // In production, could send to analytics service
  }

  warn(message: string, context?: LogContext): void {
    const sanitizedContext = this.sanitizeContext(context)
    const formatted = this.formatMessage('warn', message, sanitizedContext)
    
    if (this.isDevelopment) {
      console.warn(formatted)
    } else {
      // In production, send to Sentry
      captureMessage(message, 'warning', sanitizedContext)
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const sanitizedContext = this.sanitizeContext(context)
    const formatted = this.formatMessage('error', message, sanitizedContext)
    
    if (this.isDevelopment) {
      console.error(formatted, error || '')
      if (error instanceof Error) {
        console.error('Error stack:', error.stack)
      }
    } else {
      // In production, send to Sentry
      if (error instanceof Error) {
        captureException(error, sanitizedContext)
      } else {
        captureMessage(message, 'error', sanitizedContext)
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export Logger class for testing
export { Logger }



