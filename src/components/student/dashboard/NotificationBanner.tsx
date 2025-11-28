import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { formatDistanceToNow } from 'date-fns'
import { StudentNotification } from '@/lib/student-notifications'
import { COLORS, SPACING, RADIUS } from '@/lib/design-system'

interface NotificationBannerProps {
  notification: StudentNotification
  onPress?: () => void
  onDismiss?: () => void
}

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

export function NotificationBanner({ notification, onPress, onDismiss }: NotificationBannerProps) {
  const router = useRouter()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push(`/(student)/(tabs)/notification-details?id=${notification.id}`)
    }
  }

  const icon = TYPE_ICONS[notification.type] || 'megaphone'
  const colorValue = TYPE_COLORS[notification.type] || '#7B2CBF'
  const colors = (Array.isArray(colorValue) ? colorValue : [colorValue, colorValue]) as [string, string, ...string[]]
  const timeAgo = notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : 'Recently'

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text variant="titleSmall" style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text variant="bodySmall" style={styles.message} numberOfLines={2}>
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
            {onDismiss && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation()
                  onDismiss()
                }}
                style={styles.dismissButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  banner: {
    borderRadius: RADIUS.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  message: {
    color: '#fff',
    opacity: 0.95,
    marginBottom: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  time: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 9,
    marginTop: 1,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: SPACING.sm,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dismissButton: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
})

