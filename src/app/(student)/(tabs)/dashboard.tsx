import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCallback, useRef, useState } from 'react'
import { StudentHeader } from '@/components/student/StudentHeader'
import { HeroWelcomeSection } from '@/components/student/dashboard/HeroWelcomeSection'
import { OverviewStatsSection } from '@/components/student/dashboard/OverviewStatsSection'
import { QuickInsightsCard } from '@/components/student/dashboard/QuickInsightsCard'
import { QuickActionsSection } from '@/components/student/dashboard/QuickActionsSection'
import { AlertsSection } from '@/components/student/dashboard/AlertsSection'
import { RecentActivitySection } from '@/components/student/dashboard/RecentActivitySection'
import { ErrorState } from '@/components/student/dashboard/ErrorState'
import { NotificationBanner } from '@/components/student/dashboard/NotificationBanner'
import { useStudentDashboard } from '@/hooks/useStudentDashboard'
import { markNotificationAsRead } from '@/lib/student-notifications'
import { COLORS, SPACING } from '@/lib/design-system'

export default function StudentDashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const {
    student,
    attendanceStats,
    feeStats,
    profileCompletion,
    recentAttendance,
    recentFees,
    recentNotification,
    unreadCount,
    loading,
    refreshing,
    error,
    onRefresh,
  } = useStudentDashboard(user?.id)

  const [dismissedNotificationId, setDismissedNotificationId] = useState<string | null>(null)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const hasLoadedOnFocusRef = useRef<boolean>(false)
  const onRefreshRef = useRef(onRefresh)
  const refreshingRef = useRef(refreshing)

  // Keep refs updated
  onRefreshRef.current = onRefresh
  refreshingRef.current = refreshing

  // Auto-refresh when screen comes into focus (only once per focus)
  useFocusEffect(
    useCallback(() => {
      // Skip if just loaded or currently refreshing
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
      if (refreshingRef.current || timeSinceLastLoad < 2000 || hasLoadedOnFocusRef.current) {
        return
      }

      // Mark as loaded and reload data
      hasLoadedOnFocusRef.current = true
      lastLoadTimeRef.current = Date.now()
      onRefreshRef.current()
      
      // Reset flag when screen loses focus (cleanup)
      return () => {
        hasLoadedOnFocusRef.current = false
      }
    }, []) // Empty dependencies - only run on focus/blur, not on state changes
  )

  // Get student name for display
  const studentName = student
    ? `${student.first_name} ${student.last_name}`.trim() || user?.email?.split('@')[0] || 'Student'
    : user?.email?.split('@')[0] || 'Student'

  // Get profile image URL
  const profileImageUrl = student?.student_photo_url || null

  // Calculate attendance percentage
  const attendancePercentage = attendanceStats?.attendancePercentage || 0
  const totalClasses = attendanceStats?.totalClasses || 0

  // Calculate fee amounts
  const pendingFees = feeStats.totalPending || 0
  const overdueFees = feeStats.totalOverdue || 0

  // Determine fee status for insights
  const feeStatus = overdueFees > 0 ? 'overdue' : pendingFees > 0 ? 'pending' : 'paid'

  // Get current belt
  const currentBelt = student?.current_belt || 'White'

  // Get attendance streak from stats
  const attendanceStreak = attendanceStats?.attendanceStreak || 0

  // Check for low attendance (below 75%)
  const lowAttendance = attendancePercentage < 75 && totalClasses > 0

  // Get upcoming fee due date (first pending fee)
  const upcomingFee = recentFees.find((f) => f.status === 'pending' || f.status === 'overdue')
  const upcomingFeeDue = upcomingFee
    ? new Date(upcomingFee.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined

  // Handle notification banner press
  const handleNotificationPress = async () => {
    if (!recentNotification) return
    
    // Mark as read if not already read
    if (!recentNotification.read) {
      await markNotificationAsRead(recentNotification.id)
      // Refresh to update unread count
      onRefresh()
    }
    
    router.push(`/(student)/(tabs)/notification-details?id=${recentNotification.id}`)
  }

  // Check if notification should be shown (within 24 hours and not dismissed)
  const shouldShowNotification = (() => {
    if (!recentNotification || recentNotification.id === dismissedNotificationId) {
      return false
    }
    
    // Check if notification is within 24 hours
    if (!recentNotification.createdAt) {
      return false
    }
    
    const notificationDate = new Date(recentNotification.createdAt)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    
    // Show banner for 24 hours regardless of read status
    return notificationDate >= twentyFourHoursAgo
  })()

  if (error && !loading) {
    return (
      <View style={styles.container}>
        <StudentHeader />
        <ErrorState message={error.message} onRetry={onRefresh} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StudentHeader unreadNotificationCount={unreadCount} />
      
      {/* Notification Banner - shows for 24 hours */}
      {shouldShowNotification && (
        <NotificationBanner
          notification={recentNotification}
          onPress={handleNotificationPress}
          onDismiss={() => setDismissedNotificationId(recentNotification.id)}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <HeroWelcomeSection userName={studentName} profileImageUrl={profileImageUrl} />

        <OverviewStatsSection
          attendancePercentage={attendancePercentage}
          totalClasses={totalClasses}
          pendingFees={pendingFees}
          overdueFees={overdueFees}
          profileCompletion={profileCompletion}
          loading={loading}
        />

        {!loading && student && (
          <QuickInsightsCard
            currentBelt={currentBelt}
            attendanceStreak={attendanceStreak}
            feeStatus={feeStatus}
          />
        )}

        <QuickActionsSection />

        {!loading && (
          <AlertsSection
            overdueFees={overdueFees}
            profileCompletion={profileCompletion}
            lowAttendance={lowAttendance}
            upcomingFeeDue={upcomingFeeDue}
          />
        )}

        {!loading && (
          <RecentActivitySection
            recentAttendance={recentAttendance || []}
            recentFees={recentFees || []}
          />
        )}
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
  },
})
