import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native'
import { Text } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useFocusEffect } from 'expo-router'
import { format } from 'date-fns'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getProfileByUserId, getAdminProfileByUserId } from '@/lib/profiles'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { OverviewStatsSection } from '@/components/admin/dashboard/OverviewStatsSection'
import { QuickActionsSection } from '@/components/admin/dashboard/QuickActionsSection'
import { AlertsSection } from '@/components/admin/dashboard/AlertsSection'
import { RecentBranchesSection } from '@/components/admin/dashboard/RecentBranchesSection'
import { logger } from '@/lib/logger'
import { AllFeaturesSection } from '@/components/admin/dashboard/AllFeaturesSection'
import { ErrorState } from '@/components/admin/dashboard/ErrorState'
import { HeroWelcomeSection } from '@/components/admin/dashboard/HeroWelcomeSection'
import { QuickInsightsCard } from '@/components/admin/dashboard/QuickInsightsCard'
import { COLORS, SPACING } from '@/lib/design-system'
import { getPendingInformsCount } from '@/lib/student-leave-informs'

export default function AdminDashboardScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { branches, studentStats, loading, refreshing, error, onRefresh, reload } = useAdminDashboard()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [adminName, setAdminName] = useState<string | null>(null)
  const [pendingInformsCount, setPendingInformsCount] = useState(0)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const hasLoadedOnFocusRef = useRef<boolean>(false)
  const reloadRef = useRef(reload)
  const refreshingRef = useRef(refreshing)

  // Keep refs updated
  reloadRef.current = reload
  refreshingRef.current = refreshing

  const loadProfileImage = useCallback(async () => {
    if (user?.id) {
      const result = await getAdminProfileByUserId(user.id)
      if (result.profile) {
        setProfileImageUrl(result.profile.profileImageUrl || null)
        setAdminName(result.profile.name || null)
      }
    }
  }, [user?.id])

  const loadPendingCount = useCallback(async () => {
    const result = await getPendingInformsCount()
    if (!result.error) {
      setPendingInformsCount(result.count)
    }
  }, [])

  useEffect(() => {
    checkRole()
    loadProfileImage()
    loadPendingCount()
  }, [user, loadProfileImage, loadPendingCount])

  // Reload data when screen comes into focus (e.g., after creating/editing students/branches)
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return

      // Skip if just loaded or currently refreshing
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
      if (refreshingRef.current || timeSinceLastLoad < 2000 || hasLoadedOnFocusRef.current) {
        return
      }

      // Mark as loaded and reload data
      hasLoadedOnFocusRef.current = true
      lastLoadTimeRef.current = Date.now()
      
      // Load profile image and reload dashboard data
      loadProfileImage()
      loadPendingCount()
      reloadRef.current()
      
      // Reset flag when screen loses focus (cleanup)
      return () => {
        hasLoadedOnFocusRef.current = false
      }
    }, [user?.id, loadProfileImage, loadPendingCount]) // Only depend on user.id and loadProfileImage
  )

  const checkRole = async () => {
    if (user?.id) {
      const result = await getProfileByUserId(user.id)
      if (result.profile && result.profile.role === 'super_admin') {
        setIsSuperAdmin(true)
      }
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear React Query cache
              queryClient.clear()
              // Sign out from Supabase
              await signOut()
              // Navigate to login
              router.replace('/(auth)/login')
            } catch (error) {
              logger.error('Error signing out', error instanceof Error ? error : new Error(String(error)))
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          },
        },
      ]
    )
  }

  const today = format(new Date(), 'EEEE, MMM dd, yyyy')
  const time = format(new Date(), 'h:mm a')
  const activeBranches = branches.filter((b) => b.status === 'active').length
  const totalBranches = branches.length

  // Show error state if there's an error and no data
  if (error && branches.length === 0 && !studentStats) {
    return (
      <View style={styles.container}>
        <AdminHeader subtitle={`${today} • ${time}`} pendingInformsCount={pendingInformsCount} />
        <ErrorState message="Failed to load dashboard data" onRetry={reload} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <AdminHeader subtitle={`${today} • ${time}`} pendingInformsCount={pendingInformsCount} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Welcome Section */}
        <HeroWelcomeSection 
          userName={adminName || user?.email?.split('@')[0] || 'Admin'} 
          profileImageUrl={profileImageUrl}
        />

        {/* Overview Stats */}
        <OverviewStatsSection
          totalBranches={totalBranches}
          activeBranches={activeBranches}
          studentStats={studentStats}
          loading={loading && branches.length === 0}
        />

        {/* Quick Insights */}
        <QuickInsightsCard
          totalBranches={totalBranches}
          activeBranches={activeBranches}
          studentStats={studentStats}
          branches={branches}
        />

        {/* Quick Actions */}
        <QuickActionsSection />

        {/* Alerts */}
        <AlertsSection branches={branches} studentStats={studentStats} />

        {/* Recent Branches */}
        <RecentBranchesSection branches={branches} />

        {/* All Features */}
        <AllFeaturesSection />

        {/* Bottom Padding for Tab Bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 80,
  },
  bottomPadding: {
    height: SPACING.lg,
  },
})
