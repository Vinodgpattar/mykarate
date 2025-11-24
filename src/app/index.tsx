import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { Text } from 'react-native-paper'
import { getProfileByUserId } from '@/lib/profiles'

export default function Index() {
  const { session, loading, signOut } = useAuth()
  const router = useRouter()
  const hasRoutedRef = useRef(false)

  console.log('Index: Component rendered - loading:', loading, 'hasSession:', !!session)

  // Reset routing flag when session user ID changes
  useEffect(() => {
    if (session?.user?.id) {
      console.log('Index: Session user ID changed, resetting routing flag')
      hasRoutedRef.current = false
    }
  }, [session?.user?.id])

  useEffect(() => {
    console.log('Index: useEffect triggered - loading:', loading, 'hasSession:', !!session, 'hasRouted:', hasRoutedRef.current)
    
    // Prevent multiple routing attempts
    if (hasRoutedRef.current) {
      console.log('Index: Already routed, skipping...')
      return
    }
    
    const checkAuthAndRoute = async () => {
      if (loading) {
        console.log('Index: Still loading auth state...')
        return
      }

      if (!session) {
        console.log('Index: No session, routing to login')
        hasRoutedRef.current = true
        router.replace('/(auth)/login')
        return
      }

      // Get role from profiles table
      if (session.user.id) {
        console.log('Index: Getting role from profiles table')
        try {
          const result = await getProfileByUserId(session.user.id)
          
          if (result.error) {
            console.error('Index: Error fetching profile:', result.error)
            await signOut()
            router.replace('/(auth)/login')
            return
          }
          
          if (!result.profile) {
            console.warn('Index: No profile found - denying access')
            await signOut()
            router.replace('/(auth)/login')
            return
          }

          const role = result.profile.role
          console.log('Index: Role from profiles:', role)

          if (role === 'student') {
            console.log('Index: Student role confirmed, routing to student dashboard')
            hasRoutedRef.current = true
            router.replace('/(student)/(tabs)/dashboard')
            return
          }

          if (role === 'admin' || role === 'super_admin') {
            console.log('Index: Admin role confirmed, routing to admin dashboard')
            hasRoutedRef.current = true
            router.replace('/(admin)/(tabs)')
            return
          }

          // Unknown role - deny access
          console.warn('Index: Unknown role - denying access')
          await signOut()
          router.replace('/(auth)/login')
        } catch (error) {
          console.error('Index: Error checking user role:', error)
          await signOut()
          router.replace('/(auth)/login')
        }
      } else {
        console.error('Index: No user ID in session - invalid session')
        await signOut()
        router.replace('/(auth)/login')
      }
    }

    checkAuthAndRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loading, signOut])

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


