import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'
import { OverviewStatsSkeleton } from './SkeletonLoader'

interface OverviewStatsSectionProps {
  attendancePercentage: number
  totalClasses: number
  pendingFees: number
  overdueFees: number
  profileCompletion: number
  loading?: boolean
}

export function OverviewStatsSection({
  attendancePercentage,
  totalClasses,
  pendingFees,
  overdueFees,
  profileCompletion,
  loading = false,
}: OverviewStatsSectionProps) {
  const router = useRouter()

  if (loading) {
    return (
      <View style={styles.section}>
        <OverviewStatsSkeleton />
      </View>
    )
  }

  const stats = [
    {
      icon: 'calendar-check',
      value: `${attendancePercentage}%`,
      label: 'Attendance',
      color: '#6366F1',
      bgColor: '#F8F9FF',
      iconBg: '#EEF2FF',
      onPress: () => router.push('/(student)/(tabs)/my-attendance'),
    },
    {
      icon: 'account-group',
      value: totalClasses,
      label: 'Classes',
      color: '#7B2CBF',
      bgColor: '#FAF5FF',
      iconBg: '#F3E8FF',
      onPress: () => router.push('/(student)/(tabs)/my-attendance'),
    },
    {
      icon: 'cash-clock',
      value: `₹${pendingFees.toLocaleString()}`,
      label: 'Pending',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      iconBg: '#FEF3C7',
      onPress: () => router.push('/(student)/(tabs)/my-fees'),
    },
    {
      icon: 'alert-circle',
      value: `₹${overdueFees.toLocaleString()}`,
      label: 'Overdue',
      color: '#EF4444',
      bgColor: '#FEF2F2',
      iconBg: '#FEE2E2',
      onPress: () => router.push('/(student)/(tabs)/my-fees'),
    },
    {
      icon: 'account-check',
      value: `${profileCompletion}%`,
      label: 'Profile',
      color: '#10B981',
      bgColor: '#F0FDF4',
      iconBg: '#D1FAE5',
      onPress: () => router.push('/(student)/(tabs)/profile'),
    },
  ]

  return (
    <View style={styles.section}>
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={stat.onPress}
          >
            <View style={[styles.cardContainer, { backgroundColor: stat.bgColor }]}>
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: stat.iconBg }]}>
                  <MaterialCommunityIcons name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <View style={styles.statInfo}>
                  <Text variant="headlineSmall" style={[styles.statValue, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    {stat.label}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '48%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  cardContainer: {
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
    marginBottom: 1,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})

