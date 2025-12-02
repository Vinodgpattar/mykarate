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
        // Only check for updates in production builds
        if (__DEV__) {
          logger.debug('Skipping update check in development mode')
          return
        }

        const update = await Updates.checkForUpdateAsync()
        
        if (update.isAvailable) {
          logger.info('Update available, downloading...')
          await Updates.fetchUpdateAsync()
          logger.info('Update downloaded, will apply on next app restart')
          // Optionally, you can reload immediately:
          // await Updates.reloadAsync()
        } else {
          logger.debug('App is up to date')
        }
      } catch (error) {
        logger.error('Error checking for updates', error as Error)
      }
    }

    checkForUpdates()
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



