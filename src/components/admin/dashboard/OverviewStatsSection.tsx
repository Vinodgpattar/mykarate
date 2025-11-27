import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'
import { OverviewStatsSkeleton } from './SkeletonLoader'

interface StudentStats {
  total: number
  active: number
  inactive: number
  profileCompleted: number
  profileIncomplete: number
}

interface OverviewStatsSectionProps {
  totalBranches: number
  activeBranches: number
  studentStats: StudentStats | null
  loading?: boolean
}

export function OverviewStatsSection({
  totalBranches,
  activeBranches,
  studentStats,
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
      icon: 'office-building',
      value: totalBranches,
      label: 'Branches',
      color: '#6366F1',
      bgColor: '#F8F9FF',
      iconBg: '#EEF2FF',
      onPress: () => router.push('/(admin)/(tabs)/branches'),
    },
    {
      icon: 'check-circle',
      value: activeBranches,
      label: 'Active',
      color: '#10B981',
      bgColor: '#F0FDF4',
      iconBg: '#D1FAE5',
      onPress: () => router.push('/(admin)/(tabs)/branches'),
    },
    ...(studentStats
      ? [
          {
            icon: 'account-group' as const,
            value: studentStats.total,
            label: 'Students',
            color: '#7B2CBF',
            bgColor: '#FAF5FF',
            iconBg: '#F3E8FF',
            onPress: () => router.push('/(admin)/(tabs)/students'),
          },
          {
            icon: 'account-check' as const,
            value: studentStats.profileCompleted,
            label: 'Complete',
            color: '#10B981',
            bgColor: '#F0FDF4',
            iconBg: '#D1FAE5',
            onPress: () => router.push('/(admin)/(tabs)/students'),
          },
          {
            icon: 'account-alert' as const,
            value: studentStats.profileIncomplete,
            label: 'Pending',
            color: '#F59E0B',
            bgColor: '#FFFBEB',
            iconBg: '#FEF3C7',
            onPress: () => router.push('/(admin)/(tabs)/students'),
          },
        ]
      : []),
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
