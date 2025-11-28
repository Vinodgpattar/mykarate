import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native'
import { Text, Button, Searchbar, Chip, ActivityIndicator, FAB, Card } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getNotifications, deleteNotification, type Notification, type NotificationType } from '@/lib/admin-notifications'
import { logger } from '@/lib/logger'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'

const NOTIFICATION_TYPES: NotificationType[] = ['announcement', 'alert', 'reminder', 'achievement', 'event', 'payment', 'class', 'system']

const TYPE_ICONS: Record<NotificationType, string> = {
  announcement: 'bullhorn',
  alert: 'alert',
  reminder: 'bell',
  achievement: 'trophy',
  event: 'calendar',
  payment: 'cash',
  class: 'karate',
  system: 'cog',
}

const TYPE_COLORS: Record<NotificationType, string[]> = {
  announcement: ['#6366F1', '#4F46E5'],
  alert: ['#EF4444', '#DC2626'],
  reminder: ['#F59E0B', '#D97706'],
  achievement: ['#10B981', '#059669'],
  event: ['#8B5CF6', '#7C3AED'],
  payment: ['#06B6D4', '#0891B2'],
  class: ['#7B2CBF', '#6D28D9'],
  system: ['#6B7280', '#4B5563'],
}

export default function AdminNotificationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    loadData()
  }, [selectedType, searchQuery])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Always refresh when screen comes into focus (e.g., after creating a notification)
      // Only skip if currently loading to prevent duplicate requests
      if (isLoadingRef.current) {
        return
      }

      // Reset page and reload data
      setPage(1)
      isLoadingRef.current = true
      loadData(1).finally(() => {
        isLoadingRef.current = false
        lastLoadTimeRef.current = Date.now()
      })
    }, [selectedType, searchQuery])
  )

  const loadData = async (pageNum: number = 1) => {
    try {
      setLoading(pageNum === 1)
      const result = await getNotifications({
        search: searchQuery || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        page: pageNum,
        limit: 20,
      })

      if (result.error) {
        logger.error('Error loading notifications', result.error)
        return
      }

      if (pageNum === 1) {
        setNotifications(result.notifications || [])
      } else {
        setNotifications((prev) => [...prev, ...(result.notifications || [])])
      }

      setTotal(result.total)
      setHasMore((result.notifications || []).length === 20)
    } catch (error) {
      logger.error('Unexpected error loading notifications', error as Error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      lastLoadTimeRef.current = Date.now()
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setPage(1)
    await loadData(1)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadData(nextPage)
    }
  }

  const getTargetLabel = (notification: Notification) => {
    if (notification.targetType === 'all') return 'All Students'
    if (notification.targetType === 'branch') return 'Branch'
    return 'Selected Students'
  }

  const handleDelete = async (notificationId: string, title: string) => {
    Alert.alert(
      'Delete Notification',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(notificationId)
            try {
              const result = await deleteNotification(notificationId)
              if (result.success) {
                // Remove from local state
                setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
                setTotal((prev) => Math.max(0, prev - 1))
                logger.info('Notification deleted successfully', { notificationId })
              } else {
                Alert.alert('Error', result.error?.message || 'Failed to delete notification')
              }
            } catch (error) {
              logger.error('Unexpected error deleting notification', error as Error)
              Alert.alert('Error', 'Failed to delete notification')
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  const filteredNotifications = notifications

  return (
    <View style={styles.container}>
      <AdminHeader title="Notifications" />

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search notifications..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          <Chip
            selected={selectedType === 'all'}
            onPress={() => setSelectedType('all')}
            style={styles.chip}
            selectedColor="#7B2CBF"
          >
            All
          </Chip>
          {NOTIFICATION_TYPES.map((type) => (
            <Chip
              key={type}
              selected={selectedType === type}
              onPress={() => setSelectedType(type)}
              style={styles.chip}
              selectedColor={TYPE_COLORS[type][0]}
              icon={() => <MaterialCommunityIcons name={TYPE_ICONS[type] as any} size={16} />}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.cardContainer}>
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="send" size={18} color="#6366F1" />
              </View>
              <View style={styles.statInfo}>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {total}
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>
                  Total Sent
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
          const paddingToBottom = 20
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore()
          }
        }}
        scrollEventThrottle={400}
      >
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="bell-off" size={64} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No notifications found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery || selectedType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first notification to get started'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const icon = TYPE_ICONS[notification.type]
            const colorValue = TYPE_COLORS[notification.type] || '#7B2CBF'
            const colors = (Array.isArray(colorValue) ? colorValue : [colorValue, colorValue]) as [string, string, ...string[]]
            const timeAgo = notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
              ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
              : 'Recently'

            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => router.push(`/(admin)/(tabs)/notification-details?id=${notification.id}`)}
                activeOpacity={0.8}
                style={styles.notificationContainer}
              >
                <LinearGradient
                  colors={colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.notificationBanner}
                >
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerLeft}>
                      <View style={styles.bannerIconContainer}>
                        <MaterialCommunityIcons name={(icon || 'megaphone') as any} size={24} color="#fff" />
                      </View>
                      <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                          <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                            {notification.title}
                          </Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id, notification.title)
                            }}
                            disabled={deletingId === notification.id}
                            style={styles.deleteButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            {deletingId === notification.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <MaterialCommunityIcons name="delete-outline" size={20} color="#fff" />
                            )}
                          </TouchableOpacity>
                        </View>
                        <Text variant="bodyMedium" style={styles.message} numberOfLines={3}>
                          {notification.message}
                        </Text>
                        <View style={styles.metaRow}>
                          <Text variant="labelSmall" style={styles.time}>
                            {timeAgo}
                          </Text>
                          <Text variant="labelSmall" style={styles.statsText}>
                            {notification.readCount}/{notification.totalSent} read
                          </Text>
                        </View>
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

        {hasMore && !loading && filteredNotifications.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <Button mode="text" onPress={loadMore} textColor="#7B2CBF">
              Load More
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(admin)/(tabs)/create-notification')}
        label="Create"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchbar: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    elevation: 0,
    backgroundColor: COLORS.borderLight,
  },
  chipsContainer: {
    paddingHorizontal: SPACING.lg,
  },
  chip: {
    marginRight: SPACING.sm,
  },
  statsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  statCard: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  cardContainer: {
    backgroundColor: '#F8F9FF',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#6366F1',
    marginBottom: 1,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
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
  emptyCard: {
    elevation: ELEVATION.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.surface,
  },
  emptyContent: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: SPACING.lg,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Notification Banner Styles (matching student design)
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
  bannerIconContainer: {
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
    justifyContent: 'space-between',
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  time: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 11,
  },
  statsText: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 11,
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
  deleteButton: {
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadMoreContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: 80,
    backgroundColor: COLORS.brandPurple,
  },
})

