import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { getStudentNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount, type StudentNotification } from '@/lib/student-notifications'
import { logger } from '@/lib/logger'
import { StudentHeader } from '@/components/student/StudentHeader'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'
import { useNotifications } from '@/context/NotificationContext'
import { Card } from 'react-native-paper'
import { Linking, Platform } from 'react-native'

const TYPE_ICONS: Record<string, string> = {
  announcement: 'bullhorn',
  alert: 'alert',
  reminder: 'bell',
  achievement: 'trophy',
  event: 'calendar',
  payment: 'cash',
  class: 'karate',
  system: 'cog',
}

const TYPE_COLORS: Record<string, string[]> = {
  announcement: ['#6366F1', '#4F46E5'],
  alert: ['#EF4444', '#DC2626'],
  reminder: ['#F59E0B', '#D97706'],
  achievement: ['#10B981', '#059669'],
  event: ['#8B5CF6', '#7C3AED'],
  payment: ['#06B6D4', '#0891B2'],
  class: ['#7B2CBF', '#6D28D9'],
  system: ['#6B7280', '#4B5563'],
}

export default function StudentNotificationsScreen() {
  const router = useRouter()
  const { permissionsGranted, requestPermissions } = useNotifications()
  const [notifications, setNotifications] = useState<StudentNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    loadData()
    loadUnreadCount()
  }, [])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Skip if just loaded or currently loading
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
      if (isLoadingRef.current || timeSinceLastLoad < 1000) {
        return
      }

      // Reload data
      isLoadingRef.current = true
      Promise.all([loadData(), loadUnreadCount()]).finally(() => {
        isLoadingRef.current = false
        lastLoadTimeRef.current = Date.now()
      })
    }, [])
  )

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getStudentNotifications({ limit: 100 })

      if (result.error) {
        logger.error('Error loading notifications', result.error)
        return
      }

      setNotifications(result.notifications || [])
    } catch (error) {
      logger.error('Unexpected error loading notifications', error as Error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      lastLoadTimeRef.current = Date.now()
    }
  }

  const loadUnreadCount = async () => {
    try {
      const result = await getUnreadCount()
      if (!result.error) {
        setUnreadCount(result.count)
      }
    } catch (error) {
      logger.error('Error loading unread count', error as Error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadData(), loadUnreadCount()])
  }

  const handleNotificationPress = async (notification: StudentNotification) => {
    // Navigate to notification details
    router.push(`/(student)/(tabs)/notification-details?id=${notification.id}`)
    
    // Mark as read if not already read
    if (!notification.read) {
      const result = await markNotificationAsRead(notification.id)
      if (!result.error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    }
  }

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (!result.error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    }
  }

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions()
    if (!granted) {
      // If permission denied, open app settings
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:')
      } else {
        Linking.openSettings()
      }
    }
  }

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:')
    } else {
      Linking.openSettings()
    }
  }

  return (
    <View style={styles.container}>
      <StudentHeader 
        title="Announcements"
        subtitle={unreadCount > 0 ? `${unreadCount} new announcement${unreadCount > 1 ? 's' : ''}` : undefined}
      />
      
      {unreadCount > 0 && (
        <View style={styles.actionBar}>
          <Button 
            mode="text" 
            onPress={handleMarkAllRead} 
            textColor={COLORS.brandPurple}
            icon="check-all"
            compact
          >
            Mark All Read
          </Button>
        </View>
      )}

      {/* Permission Banner */}
      {!permissionsGranted && (
        <Card style={styles.permissionBanner}>
          <Card.Content style={styles.permissionContent}>
            <View style={styles.permissionRow}>
              <MaterialCommunityIcons name="bell-off" size={24} color="#F59E0B" />
              <View style={styles.permissionTextContainer}>
                <Text variant="titleSmall" style={styles.permissionTitle}>
                  Enable Notifications
                </Text>
                <Text variant="bodySmall" style={styles.permissionText}>
                  Get instant alerts when admin sends announcements
                </Text>
              </View>
            </View>
            <View style={styles.permissionActions}>
              <Button
                mode="contained"
                onPress={handleRequestPermissions}
                buttonColor={COLORS.brandPurple}
                compact
                style={styles.permissionButton}
              >
                Enable
              </Button>
              <Button
                mode="text"
                onPress={openAppSettings}
                textColor={COLORS.textSecondary}
                compact
                style={styles.permissionButton}
              >
                Settings
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-outline" size={64} color="#D1D5DB" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Announcements
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              You'll see announcements from admin here
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const icon = TYPE_ICONS[notification.type] || 'megaphone'
            const colors = TYPE_COLORS[notification.type] || ['#7B2CBF', '#6D28D9']
            const timeAgo = notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
              ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
              : 'Recently'

            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.8}
                style={styles.notificationContainer}
              >
                <LinearGradient
                  colors={colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.notificationBanner}
                >
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerLeft}>
                      <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name={icon as any} size={24} color="#fff" />
                      </View>
                      <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                          <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        <Text variant="bodyMedium" style={styles.message} numberOfLines={3}>
                          {notification.message}
                        </Text>
                        <Text variant="labelSmall" style={styles.time}>
                          {timeAgo}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bannerRight}>
                      {notification.imageUrl && (
                        <Image
                          source={{ uri: notification.imageUrl }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )
          })
        )}
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
  actionBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  // Notification Banner Styles (larger than dashboard banner)
  notificationContainer: {
    marginBottom: SPACING.md,
  },
  notificationBanner: {
    borderRadius: RADIUS.md,
    elevation: ELEVATION.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  message: {
    color: '#fff',
    opacity: 0.95,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  time: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 11,
    marginTop: 4,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  permissionBanner: {
    margin: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    elevation: 2,
  },
  permissionContent: {
    padding: SPACING.md,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  permissionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  permissionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  permissionButton: {
    minWidth: 80,
  },
})

