import { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getProfileByUserId } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'

export default function StudentLayout() {
  const { session, loading: authLoading, user } = useAuth()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkStudentAccess = async () => {
      if (authLoading) return

      // Check if session is still valid
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        router.replace('/(auth)/login')
        return
      }

      if (!session || !user) {
        router.replace('/(auth)/login')
        return
      }

      // Get role from profiles table
      if (user.id) {
        setCheckingRole(true)
        try {
          const result = await getProfileByUserId(user.id)
          
          if (result.error) {
            console.error('StudentLayout: Error fetching profile:', result.error)
            router.replace('/(auth)/login')
            return
          }

          if (!result.profile) {
            console.warn('StudentLayout: No profile found - denying access')
            router.replace('/(auth)/login')
            return
          }

          const role = result.profile.role
          console.log('StudentLayout: Role from profiles:', role)

          if (role === 'student') {
            setIsAuthorized(true)
            setCheckingRole(false)
            return
          }

          if (role === 'admin' || role === 'super_admin') {
            console.log('StudentLayout: User is admin, redirecting')
            router.replace('/(admin)/(tabs)')
            return
          }

          // Unknown role - deny access
          console.warn('StudentLayout: Unknown role - denying access')
          router.replace('/(auth)/login')
        } catch (error) {
          console.error('StudentLayout: Error checking student access:', error)
          router.replace('/(auth)/login')
        }
      } else {
        router.replace('/(auth)/login')
      }
    }

    checkStudentAccess()
  }, [session, user, authLoading, router])

  if (authLoading || checkingRole) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Checking access...
        </Text>
      </View>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Add more student screens here as needed */}
    </Stack>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
})


