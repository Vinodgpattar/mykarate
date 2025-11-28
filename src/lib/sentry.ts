/**
 * Sentry error tracking setup
 * 
 * To enable Sentry:
 * 1. Install: npm install @sentry/react-native
 * 2. Get DSN from https://sentry.io
 * 3. Add EXPO_PUBLIC_SENTRY_DSN to .env.local
 * 4. Uncomment the initialization code below
 */

let sentryInitialized = false

export function initSentry() {
  if (sentryInitialized) return

  // Check if Sentry DSN is configured
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN

  if (!dsn) {
    // Sentry not configured - will use console logging
    return
  }

  try {
    // Sentry is now installed
    const Sentry = require('@sentry/react-native')

    Sentry.init({
      dsn: dsn,
      enableInExpoDevelopment: false, // Disable in dev
      debug: __DEV__, // Enable debug mode in development
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: 1.0, // 100% of transactions for performance monitoring
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies
          if (event.request.headers) {
            delete event.request.headers['Authorization']
            delete event.request.headers['authorization']
          }
        }
        return event
      },
    })

    sentryInitialized = true
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (sentryInitialized) {
    try {
      const Sentry = require('@sentry/react-native')
      Sentry.captureException(error, {
        contexts: context ? { custom: context } : undefined,
      })
      return
    } catch (err) {
      // Fallback if Sentry fails
    }
  }
  
  // Fallback to console in development
  if (__DEV__) {
    console.error('Sentry would capture:', error, context)
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  if (sentryInitialized) {
    try {
      const Sentry = require('@sentry/react-native')
      Sentry.captureMessage(message, {
        level: level as any,
        contexts: context ? { custom: context } : undefined,
      })
      return
    } catch (err) {
      // Fallback if Sentry fails
    }
  }
  
  // Fallback to console in development
  if (__DEV__) {
    console.log(`[Sentry ${level}]`, message, context)
  }
}



