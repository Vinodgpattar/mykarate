import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS, RADIUS, SPACING } from '@/lib/design-system'
import type { Branch } from '@/lib/branches'

interface StudentStats {
  total: number
  active: number
  inactive: number
  profileCompleted: number
  profileIncomplete: number
}

interface QuickInsightsCardProps {
  totalBranches: number
  activeBranches: number
  studentStats: StudentStats | null
  branches: Branch[]
}

export function QuickInsightsCard({
  totalBranches,
  activeBranches,
  studentStats,
  branches,
}: QuickInsightsCardProps) {
  const router = useRouter()

  const inactiveBranches = totalBranches - activeBranches
  const profileCompletionRate = studentStats
    ? Math.round((studentStats.profileCompleted / studentStats.total) * 100)
    : 0

  const insights = [
    {
      icon: 'check-circle',
      label: 'Active',
      value: `${activeBranches}/${totalBranches}`,
      color: '#10B981',
      bgColor: '#D1FAE5',
      action: () => router.push('/(admin)/(tabs)/branches'),
    },
    {
      icon: 'account-check',
      label: 'Profiles',
      value: `${profileCompletionRate}%`,
      color: profileCompletionRate >= 80 ? '#10B981' : '#F59E0B',
      bgColor: profileCompletionRate >= 80 ? '#D1FAE5' : '#FEF3C7',
      action: () => router.push('/(admin)/(tabs)/students'),
    },
  ]

  if (studentStats && studentStats.total === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Quick Insights
      </Text>
      <View style={styles.insightsRow}>
        {insights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={styles.insightTouchable}
            activeOpacity={0.7}
            onPress={insight.action}
          >
            <Card style={[styles.card, { borderLeftColor: insight.color }]}>
              <Card.Content style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: insight.bgColor }]}>
                  <MaterialCommunityIcons
                    name={insight.icon as any}
                    size={20}
                    color={insight.color}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text variant="bodySmall" style={styles.label}>
                    {insight.label}
                  </Text>
                  <Text variant="titleMedium" style={[styles.value, { color: insight.color }]}>
                    {insight.value}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insightTouchable: {
    flex: 1,
  },
  card: {
    elevation: 2,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  content: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontWeight: '700',
    fontSize: 18,
  },
})
