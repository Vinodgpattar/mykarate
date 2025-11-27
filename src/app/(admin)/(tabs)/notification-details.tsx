import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { getNotificationById, getNotificationRecipients, deleteNotification, type Notification, type NotificationRecipient } from '@/lib/admin-notifications'
import { logger } from '@/lib/logger'
import { Alert } from 'react-native'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { COLORS, SPACING, RADIUS } from '@/lib/design-system'
import ImageViewing from 'react-native-image-viewing'

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
  const notificationId = params.id as string

  const [notification, setNotification] = useState<Notification | null>(null)
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllRecipients, setShowAllRecipients] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageViewerVisible, setImageViewerVisible] = useState(false)

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
        <AdminHeader title="Notification Details" showBackButton />
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
      <AdminHeader title="Notification Details" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delete Button */}
        <View style={styles.deleteButtonContainer}>
          <Button
            icon="delete-outline"
            onPress={handleDelete}
            mode="outlined"
            textColor="#EF4444"
            disabled={deleting}
            loading={deleting}
            style={styles.deleteButton}
          >
            Delete Notification
          </Button>
        </View>

        {/* Gradient Banner Header */}
        {(() => {
          const typeColor = TYPE_COLORS[notification.type] || '#6366F1'
          const typeIcon = TYPE_ICONS[notification.type] || 'bell'
          const createdAt = notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
            ? new Date(notification.createdAt)
            : null

          return (
            <LinearGradient
              colors={[typeColor, `${typeColor}DD`, `${typeColor}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <View style={styles.bannerContent}>
                <View style={styles.bannerIconContainer}>
                  <MaterialCommunityIcons name={typeIcon} size={44} color="#FFFFFF" />
                </View>
                <View style={styles.bannerTextContainer}>
                  <Text variant="headlineSmall" style={styles.bannerTitle}>
                    {notification.title}
                  </Text>
                  {createdAt && (
                    <View style={styles.bannerMeta}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#FFFFFF" style={styles.metaIcon} />
                      <Text style={styles.bannerTime}>
                        {format(createdAt, 'MMM dd, yyyy • hh:mm a')}
                      </Text>
                      <Text style={styles.bannerTimeAgo}>
                        {formatDistanceToNow(createdAt, { addSuffix: true })}
                      </Text>
                    </View>
                  )}
                </View>
                {notification.imageUrl && (
                  <TouchableOpacity
                    onPress={() => setImageViewerVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: notification.imageUrl }}
                      style={styles.bannerThumbnail}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          )
        })()}

        {/* Message Content */}
        <View style={styles.contentCard}>
          <Text variant="bodyLarge" style={styles.messageText}>
            {notification.message}
          </Text>
        </View>

        {/* Full Image */}
        {notification.imageUrl && (
          <TouchableOpacity
            onPress={() => setImageViewerVisible(true)}
            style={styles.imageCard}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: notification.imageUrl }}
              style={styles.fullImage}
              resizeMode="contain"
              onError={(error) => {
                logger.error('Error loading notification image', error.nativeEvent.error as Error)
              }}
              onLoad={() => {
                logger.info('Notification image loaded successfully', { url: notification.imageUrl })
              }}
            />
            <View style={styles.imageOverlay}>
              <MaterialCommunityIcons name="magnify" size={28} color="#FFFFFF" />
              <Text style={styles.imageOverlayText}>
                Tap to view full size
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Statistics */}
        <View style={styles.statsCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="send" size={18} color="#6366F1" />
              </View>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {notification.totalSent}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Sent
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <MaterialCommunityIcons name="eye" size={18} color="#10B981" />
              </View>
              <Text variant="headlineSmall" style={[styles.statNumber, { color: '#10B981' }]}>
                {notification.readCount}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Read
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="eye-off" size={18} color="#F59E0B" />
              </View>
              <Text variant="headlineSmall" style={[styles.statNumber, { color: '#F59E0B' }]}>
                {unreadRecipients.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Unread
              </Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EEF2FF' }]}>
                <MaterialCommunityIcons name="percent" size={18} color="#6366F1" />
              </View>
              <Text variant="headlineSmall" style={[styles.statNumber, { color: '#6366F1' }]}>
                {readPercentage}%
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Read Rate
              </Text>
            </View>
          </View>
        </View>

        {/* Recipients */}
        <View style={styles.recipientsCard}>
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
            <View style={styles.emptyRecipients}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#9CA3AF" />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No recipients found
              </Text>
            </View>
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
        </View>
      </ScrollView>

      <ImageViewing
        images={notification?.imageUrl ? [{ uri: notification.imageUrl }] : []}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        presentationStyle="overFullScreen"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  deleteButtonContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  banner: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  bannerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 20,
    marginBottom: SPACING.xs,
    lineHeight: 26,
  },
  bannerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaIcon: {
    marginRight: 2,
  },
  bannerTime: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  bannerTimeAgo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  bannerThumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  imageCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullImage: {
    width: '100%',
    minHeight: 300,
    maxHeight: 500,
    backgroundColor: COLORS.borderLight,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statNumber: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontSize: 22,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  recipientsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recipientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  recipientEmail: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 14,
  },
  readTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyRecipients: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyCard: {
    margin: SPACING.md,
  },
  emptyContent: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: SPACING.md,
    color: COLORS.textPrimary,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
})

