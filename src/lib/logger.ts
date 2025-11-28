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

// Helper to convert Error to LogContext
function errorToContext(error: Error | unknown): LogContext | undefined {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    }
  }
  return undefined
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

  warn(message: string, context?: LogContext | Error): void {
    // Handle Error objects passed as context
    let actualContext: LogContext | undefined = undefined
    if (context instanceof Error) {
      actualContext = errorToContext(context)
    } else {
      actualContext = context
    }
    
    const sanitizedContext = this.sanitizeContext(actualContext)
    const formatted = this.formatMessage('warn', message, sanitizedContext)
    
    if (this.isDevelopment) {
      console.warn(formatted)
      if (context instanceof Error) {
        console.warn('Error:', context)
      }
    } else {
      // In production, send to Sentry
      if (context instanceof Error) {
        captureException(context, sanitizedContext)
      } else {
        captureMessage(message, 'warning', sanitizedContext)
      }
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext | Error): void {
    // Handle case where error is passed as second parameter (context)
    let actualError: Error | unknown = undefined
    let actualContext: LogContext | undefined = undefined
    
    if (error instanceof Error) {
      actualError = error
      actualContext = context as LogContext | undefined
    } else if (context instanceof Error) {
      actualError = context
      actualContext = undefined
    } else {
      actualError = error
      actualContext = context as LogContext | undefined
    }
    
    // Merge error context if it's an Error
    const errorContext = errorToContext(actualError)
    const mergedContext = actualContext 
      ? { ...actualContext, ...errorContext }
      : errorContext
    
    const sanitizedContext = this.sanitizeContext(mergedContext)
    const formatted = this.formatMessage('error', message, sanitizedContext)
    
    if (this.isDevelopment) {
      console.error(formatted, actualError || '')
      if (actualError instanceof Error) {
        console.error('Error stack:', actualError.stack)
      }
    } else {
      // In production, send to Sentry
      if (actualError instanceof Error) {
        captureException(actualError, sanitizedContext)
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



