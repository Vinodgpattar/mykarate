import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter, useSegments } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { Text } from 'react-native-paper'
import { getProfileByUserId } from '@/lib/profiles'
import { logger } from '@/lib/logger'

export default function Index() {
  const { session, loading, signOut } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const hasRoutedRef = useRef(false)
  const routingInProgressRef = useRef(false)

  useEffect(() => {
    // Don't route if already routing or loading
    if (routingInProgressRef.current || loading) {
      return
    }

    // Check if we're already on a valid route
    const isOnPublicRoute = segments[0] === '(public)'
    const isOnAuthRoute = segments[0] === '(auth)'
    const isOnAdminRoute = segments[0] === '(admin)'
    const isOnStudentRoute = segments[0] === '(student)'
    
    // If we're already on a valid route, don't try to route again
    if (isOnPublicRoute || isOnAuthRoute || isOnAdminRoute || isOnStudentRoute) {
      logger.debug('Index: Already on route, skipping routing', { route: segments.join('/') })
      return
    }

    // Prevent multiple routing attempts
    if (hasRoutedRef.current) {
      return
    }
    
    const checkAuthAndRoute = async () => {
      routingInProgressRef.current = true

      try {
        if (!session) {
          logger.debug('Index: No session, redirecting to public view')
          hasRoutedRef.current = true
          router.replace('/(public)')
          return
        }

        // Get role from profiles table
        if (session.user.id) {
          try {
            const result = await getProfileByUserId(session.user.id)
            
            if (result.error || !result.profile) {
              logger.warn('Index: No profile found - redirecting to login')
              await signOut()
              hasRoutedRef.current = true
              router.replace('/(auth)/login')
              return
            }

            const role = result.profile.role

            if (role === 'student') {
              logger.debug('Index: Student role confirmed, routing to student dashboard')
              hasRoutedRef.current = true
              router.replace('/(student)/(tabs)/dashboard')
              return
            }

            if (role === 'admin' || role === 'super_admin') {
              logger.debug('Index: Admin role confirmed, routing to admin dashboard')
              hasRoutedRef.current = true
              router.replace('/(admin)/(tabs)')
              return
            }

            // Unknown role - deny access
            logger.warn('Index: Unknown role - redirecting to login', { role })
            await signOut()
            hasRoutedRef.current = true
            router.replace('/(auth)/login')
          } catch (error) {
            logger.error('Index: Error checking user role', error instanceof Error ? error : new Error(String(error)))
            await signOut()
            hasRoutedRef.current = true
            router.replace('/(auth)/login')
          }
        } else {
          logger.error('Index: No user ID in session - redirecting to login', new Error('No user ID in session'))
          await signOut()
          hasRoutedRef.current = true
          router.replace('/(auth)/login')
        }
      } catch (error) {
        logger.error('Index: Routing error', error instanceof Error ? error : new Error(String(error)))
        routingInProgressRef.current = false
      } finally {
        routingInProgressRef.current = false
      }
    }

    checkAuthAndRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loading, segments])

  // Show loading screen while checking auth
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7B2CBF" />
      <Text style={styles.loadingText}>
        Loading...
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
})
