import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Button, Searchbar, Chip, ActivityIndicator, Menu, Divider } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getNotifications, deleteNotification, type Notification, type NotificationType } from '@/lib/admin-notifications'
import { logger } from '@/lib/logger'
import { Alert } from 'react-native'

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

const TYPE_COLORS: Record<NotificationType, string> = {
  announcement: '#6366F1',
  alert: '#EF4444',
  reminder: '#F59E0B',
  achievement: '#10B981',
  event: '#8B5CF6',
  payment: '#06B6D4',
  class: '#7B2CBF',
  system: '#6B7280',
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

  useEffect(() => {
    loadData()
  }, [selectedType, searchQuery])

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Notifications
        </Text>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => router.push('/(admin)/(tabs)/create-notification')}
          style={styles.createButton}
          buttonColor="#7B2CBF"
        >
          Create
        </Button>
      </View>

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
              selectedColor={TYPE_COLORS[type]}
              icon={() => <MaterialCommunityIcons name={TYPE_ICONS[type]} size={16} />}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="send" size={24} color="#6366F1" />
            <Text variant="headlineSmall" style={styles.statNumber}>
              {total}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Sent
            </Text>
          </Card.Content>
        </Card>
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
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => router.push(`/(admin)/(tabs)/notification-details?id=${notification.id}`)}
              activeOpacity={0.7}
            >
              <Card style={styles.notificationCard} mode="outlined">
                <Card.Content style={styles.cardContent}>
                  <View style={styles.notificationHeader}>
                    <View style={[styles.notificationIcon, { backgroundColor: `${TYPE_COLORS[notification.type]}15` }]}>
                      <MaterialCommunityIcons
                        name={TYPE_ICONS[notification.type]}
                        size={18}
                        color={TYPE_COLORS[notification.type]}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.titleRow}>
                        <Text variant="bodyLarge" style={styles.notificationTitle} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {notification.imageUrl && (
                          <MaterialCommunityIcons name="image" size={16} color="#9CA3AF" style={styles.imageIndicator} />
                        )}
                      </View>
                      <View style={styles.metaRow}>
                        <Text variant="bodySmall" style={styles.notificationTime}>
                          {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime()) 
                            ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                            : 'Date unavailable'}
                        </Text>
                        <Text variant="bodySmall" style={styles.statsText}>
                          {notification.readCount}/{notification.totalSent} read
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id, notification.title)
                      }}
                      disabled={deletingId === notification.id}
                      style={styles.deleteButton}
                    >
                      {deletingId === notification.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text variant="bodySmall" style={styles.notificationBody} numberOfLines={2}>
                    {notification.message}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {hasMore && !loading && filteredNotifications.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <Button mode="text" onPress={loadMore} textColor="#7B2CBF">
              Load More
            </Button>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1F2937',
  },
  createButton: {
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#F9FAFB',
  },
  chipsContainer: {
    paddingHorizontal: 16,
  },
  chip: {
    marginRight: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6366F1',
    marginTop: 8,
  },
  statLabel: {
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  emptyCard: {
    elevation: 2,
    borderRadius: 12,
    marginTop: 48,
  },
  emptyContent: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  notificationCard: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 1,
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
  imageIndicator: {
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTime: {
    color: '#6B7280',
    fontSize: 11,
  },
  statsText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  deleteButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  notificationBody: {
    color: '#4B5563',
    lineHeight: 18,
    fontSize: 13,
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
})

