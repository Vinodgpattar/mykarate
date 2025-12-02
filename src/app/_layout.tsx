import 'react-native-gesture-handler'
import React from 'react'
import { Stack } from 'expo-router'
import { PaperProvider } from 'react-native-paper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initSentry } from '@/lib/sentry'
import { lightTheme } from '@/lib/theme'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { hasConfigError, configError } from '@/lib/supabase'
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen'
import * as Updates from 'expo-updates'
import { logger } from '@/lib/logger'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Inner layout that has access to both providers
function InnerLayout() {
  // Check for configuration errors first
  if (hasConfigError && configError) {
    return <ConfigErrorScreen error={configError} />
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(student)" />
          </Stack>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default function RootLayout() {
  // Initialize Sentry on app start
  React.useEffect(() => {
    initSentry()
    // ErrorBoundary component will handle React errors
    // Sentry will capture errors if configured
  }, [])

  // Check for app updates on startup
  React.useEffect(() => {
    async function checkForUpdates() {
      try {
        // Check if updates are enabled
        if (!Updates.isEnabled) {
          logger.warn('Updates are not enabled. This might be a development build or updates are disabled.')
          return
        }

        // Only check for updates in production builds
        if (__DEV__) {
          logger.debug('Skipping update check in development mode')
          return
        }

        logger.info('Checking for app updates...')
        const update = await Updates.checkForUpdateAsync()
        
        if (update.isAvailable) {
          logger.info('Update available, downloading...', { 
            manifest: update.manifest?.id,
            createdAt: update.manifest?.createdAt 
          })
          const result = await Updates.fetchUpdateAsync()
          logger.info('Update downloaded successfully', { 
            isNew: result.isNew,
            manifest: result.manifest?.id 
          })
          
          // Reload immediately to apply the update
          logger.info('Reloading app to apply update...')
          await Updates.reloadAsync()
        } else {
          logger.info('App is up to date')
        }
      } catch (error) {
        logger.error('Error checking for updates', error as Error)
        // Don't throw - update failures shouldn't break the app
      }
    }

    // Small delay to ensure app is fully initialized
    const timeoutId = setTimeout(() => {
      checkForUpdates()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={lightTheme}>
            <InnerLayout />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}



