import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getStudentNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount, type StudentNotification } from '@/lib/student-notifications'
import { logger } from '@/lib/logger'

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

const TYPE_COLORS: Record<string, string> = {
  announcement: '#6366F1',
  alert: '#EF4444',
  reminder: '#F59E0B',
  achievement: '#10B981',
  event: '#8B5CF6',
  payment: '#06B6D4',
  class: '#7B2CBF',
  system: '#6B7280',
}

export default function StudentNotificationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [notifications, setNotifications] = useState<StudentNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadData()
    loadUnreadCount()
  }, [])

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.title}>
            Announcements
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text variant="labelSmall" style={styles.badgeText}>
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Button mode="text" onPress={handleMarkAllRead} textColor="#7B2CBF">
            Mark All Read
          </Button>
        )}
      </View>

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
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard,
                ]}
                mode="outlined"
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.notificationHeader}>
                    <View style={[styles.notificationIcon, { backgroundColor: `${TYPE_COLORS[notification.type] || '#7B2CBF'}15` }]}>
                      <MaterialCommunityIcons
                        name={TYPE_ICONS[notification.type] || 'megaphone'}
                        size={18}
                        color={TYPE_COLORS[notification.type] || '#7B2CBF'}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.titleRow}>
                        <Text variant="bodyLarge" style={styles.notificationTitle} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <View style={styles.unreadDot} />
                        )}
                        {notification.imageUrl && (
                          <MaterialCommunityIcons name="image" size={16} color="#9CA3AF" style={styles.imageIndicator} />
                        )}
                      </View>
                      <Text variant="bodySmall" style={styles.notificationTime}>
                        {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                          ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                          : 'Date unavailable'}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodySmall" style={styles.notificationBody} numberOfLines={2}>
                    {notification.message}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  bottomPadding: {
    height: 20,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  notificationCard: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#7B2CBF',
    backgroundColor: '#F9FAFB',
  },
  cardContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  notificationTitle: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 15,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B2CBF',
  },
  imageIndicator: {
    marginLeft: 4,
  },
  notificationTime: {
    color: '#6B7280',
    fontSize: 11,
  },
  notificationBody: {
    color: '#4B5563',
    lineHeight: 18,
    fontSize: 13,
  },
})

