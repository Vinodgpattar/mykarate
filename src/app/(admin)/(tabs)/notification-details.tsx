import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getNotificationById, getNotificationRecipients, deleteNotification, type Notification, type NotificationRecipient } from '@/lib/admin-notifications'
import { logger } from '@/lib/logger'
import { Alert } from 'react-native'

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

export default function NotificationDetailsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const notificationId = params.id as string

  const [notification, setNotification] = useState<Notification | null>(null)
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllRecipients, setShowAllRecipients] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (notificationId) {
      loadData()
    }
  }, [notificationId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [notificationResult, recipientsResult] = await Promise.all([
        getNotificationById(notificationId),
        getNotificationRecipients(notificationId),
      ])

      if (notificationResult.error) {
        logger.error('Error loading notification', notificationResult.error)
        router.back()
        return
      }

      if (recipientsResult.error) {
        logger.error('Error loading recipients', recipientsResult.error)
      }

      setNotification(notificationResult.notification)
      setRecipients(recipientsResult.recipients || [])
    } catch (error) {
      logger.error('Unexpected error loading notification', error as Error)
      router.back()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading notification...</Text>
      </View>
    )
  }

  if (!notification) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={() => router.back()} mode="text" textColor="#666">
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            Notification Details
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#9CA3AF" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Notification not found
            </Text>
          </Card.Content>
        </Card>
      </View>
    )
  }

  const readRecipients = recipients.filter((r) => r.read)
  const unreadRecipients = recipients.filter((r) => !r.read)
  const readPercentage = notification.totalSent > 0 ? Math.round((notification.readCount / notification.totalSent) * 100) : 0

  const displayedRecipients = showAllRecipients ? recipients : recipients.slice(0, 10)

  const handleDelete = async () => {
    if (!notification) return

    Alert.alert(
      'Delete Notification',
      `Are you sure you want to delete "${notification.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              const result = await deleteNotification(notification.id)
              if (result.success) {
                logger.info('Notification deleted successfully', { notificationId: notification.id })
                router.back()
              } else {
                Alert.alert('Error', result.error?.message || 'Failed to delete notification')
              }
            } catch (error) {
              logger.error('Unexpected error deleting notification', error as Error)
              Alert.alert('Error', 'Failed to delete notification')
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Button icon="arrow-left" onPress={() => router.back()} mode="text" textColor="#666">
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>
          Notification Details
        </Text>
        <Button
          icon="delete-outline"
          onPress={handleDelete}
          mode="text"
          textColor="#EF4444"
          disabled={deleting}
          loading={deleting}
        >
          Delete
        </Button>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Notification Content */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.notificationHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${TYPE_COLORS[notification.type]}15` }]}>
                <MaterialCommunityIcons name={TYPE_ICONS[notification.type]} size={24} color={TYPE_COLORS[notification.type]} />
              </View>
              <View style={styles.headerInfo}>
                <Text variant="titleLarge" style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                <View style={styles.metaRow}>
                  <Chip
                    style={[styles.typeChip, { backgroundColor: `${TYPE_COLORS[notification.type]}15` }]}
                    textStyle={{ color: TYPE_COLORS[notification.type], fontSize: 11 }}
                    compact
                  >
                    {notification.type}
                  </Chip>
                  <Text variant="bodySmall" style={styles.metaText}>
                    {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                      ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                      : 'Date unavailable'}
                  </Text>
                </View>
              </View>
            </View>

            <Text variant="bodyMedium" style={styles.notificationMessage}>
              {notification.message}
            </Text>

            {notification.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: notification.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={(error) => {
                    logger.error('Error loading notification image', error.nativeEvent.error as Error)
                  }}
                  onLoad={() => {
                    logger.info('Notification image loaded successfully', { url: notification.imageUrl })
                  }}
                />
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="send" size={16} color="#6B7280" />
                <Text variant="bodySmall" style={styles.statText}>
                  {notification.totalSent} sent
                </Text>
              </View>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="eye" size={16} color="#10B981" />
                <Text variant="bodySmall" style={styles.statText}>
                  {notification.readCount} read ({readPercentage}%)
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Statistics
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {notification.totalSent}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Sent
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={[styles.statNumber, { color: '#10B981' }]}>
                  {notification.readCount}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Read
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#F59E0B' }]}>
                  {unreadRecipients.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Unread
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#6366F1' }]}>
                  {readPercentage}%
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Read Rate
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recipients */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Recipients ({recipients.length})
              </Text>
              {recipients.length > 10 && (
                <Button mode="text" onPress={() => setShowAllRecipients(!showAllRecipients)} textColor="#7B2CBF">
                  {showAllRecipients ? 'Show Less' : 'Show All'}
                </Button>
              )}
            </View>

            {displayedRecipients.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No recipients found
              </Text>
            ) : (
              displayedRecipients.map((recipient) => (
                <View key={recipient.id} style={styles.recipientItem}>
                  <View style={styles.recipientInfo}>
                    <MaterialCommunityIcons
                      name={recipient.read ? 'check-circle' : 'circle-outline'}
                      size={20}
                      color={recipient.read ? '#10B981' : '#9CA3AF'}
                    />
                    <Text variant="bodyMedium" style={styles.recipientEmail}>
                      {recipient.student 
                        ? `${recipient.student.first_name} ${recipient.student.last_name}` 
                        : recipient.user?.email || 'Unknown'}
                    </Text>
                  </View>
                  {recipient.read && recipient.readAt && (
                    <Text variant="bodySmall" style={styles.readTime}>
                      {!isNaN(new Date(recipient.readAt).getTime())
                        ? formatDistanceToNow(new Date(recipient.readAt), { addSuffix: true })
                        : 'Date unavailable'}
                    </Text>
                  )}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  card: {
    elevation: 1,
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 12,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    fontSize: 18,
  },
  typeChip: {
    alignSelf: 'flex-start',
    height: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaText: {
    color: '#6B7280',
    fontSize: 12,
  },
  notificationMessage: {
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
    fontSize: 14,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  divider: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  statText: {
    color: '#6B7280',
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statNumber: {
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 4,
    fontSize: 20,
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  recipientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 6,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recipientEmail: {
    color: '#1F2937',
    flex: 1,
  },
  readTime: {
    color: '#6B7280',
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    color: '#1F2937',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
})

