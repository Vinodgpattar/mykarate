import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { getNotificationById, type Notification } from '@/lib/admin-notifications'
import { markNotificationAsRead } from '@/lib/student-notifications'
import { logger } from '@/lib/logger'
import { StudentHeader } from '@/components/student/StudentHeader'
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

export default function StudentNotificationDetailsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const notificationId = params.id as string

  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageViewerVisible, setImageViewerVisible] = useState(false)

  useEffect(() => {
    if (notificationId) {
      loadData()
    }
  }, [notificationId])

  const loadData = async () => {
    try {
      setLoading(true)
      const notificationResult = await getNotificationById(notificationId)

      if (notificationResult.error) {
        logger.error('Error loading notification', notificationResult.error)
        router.back()
        return
      }

      setNotification(notificationResult.notification)

      // Mark notification as read when viewing
      if (notificationResult.notification) {
        await markNotificationAsRead(notificationId)
      }
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
        <StudentHeader title="Notification Details" showBackButton />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#9CA3AF" />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Notification not found
          </Text>
        </View>
      </View>
    )
  }

  const typeColor = TYPE_COLORS[notification.type] || '#6366F1'
  const typeIcon = TYPE_ICONS[notification.type] || 'bell'
  const sentDate = notification.sentAt && !isNaN(new Date(notification.sentAt).getTime())
    ? new Date(notification.sentAt)
    : notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
    ? new Date(notification.createdAt)
    : null

  return (
    <View style={styles.container}>
      <StudentHeader title="Notification Details" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Gradient Banner Header */}
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
              {sentDate && (
                <View style={styles.bannerMeta}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#FFFFFF" style={styles.metaIcon} />
                  <Text style={styles.bannerTime}>
                    {format(sentDate, 'MMM dd, yyyy • hh:mm a')}
                  </Text>
                  <Text style={styles.bannerTimeAgo}>
                    {formatDistanceToNow(sentDate, { addSuffix: true })}
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
            />
            <View style={styles.imageOverlay}>
              <MaterialCommunityIcons name="magnify" size={28} color="#FFFFFF" />
              <Text style={styles.imageOverlayText}>
                Tap to view full size
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ImageViewing
        images={notification.imageUrl ? [{ uri: notification.imageUrl }] : []}
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
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    color: COLORS.textPrimary,
  },
})

