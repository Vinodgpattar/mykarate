import { View, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'
import { BELT_LEVELS } from '@/lib/belts'

interface QuickInsight {
  icon: string
  label: string
  value: string
  color: string
  bgColor: string
}

interface QuickInsightsCardProps {
  currentBelt?: string
  attendanceStreak?: number
  feeStatus?: 'paid' | 'pending' | 'overdue'
}

function getNextBelt(currentBelt: string): string {
  const currentIndex = BELT_LEVELS.indexOf(currentBelt as any)
  if (currentIndex === -1 || currentIndex === BELT_LEVELS.length - 1) {
    return 'Max Level'
  }
  return BELT_LEVELS[currentIndex + 1]
}

export function QuickInsightsCard({
  currentBelt = 'White',
  attendanceStreak = 0,
  feeStatus = 'pending',
}: QuickInsightsCardProps) {
  const nextBelt = getNextBelt(currentBelt)
  const insights: QuickInsight[] = [
    {
      icon: 'karate',
      label: 'Current Belt',
      value: currentBelt,
      color: COLORS.brandPurple,
      bgColor: '#F3E8FF',
    },
    {
      icon: 'arrow-up-circle',
      label: 'Next Target',
      value: nextBelt,
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
    {
      icon: 'fire',
      label: 'Streak',
      value: `${attendanceStreak} days`,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      icon: feeStatus === 'paid' ? 'check-circle' : feeStatus === 'overdue' ? 'alert-circle' : 'clock-outline',
      label: 'Fee Status',
      value: feeStatus.charAt(0).toUpperCase() + feeStatus.slice(1),
      color: feeStatus === 'paid' ? '#10B981' : feeStatus === 'overdue' ? '#EF4444' : '#F59E0B',
      bgColor: feeStatus === 'paid' ? '#D1FAE5' : feeStatus === 'overdue' ? '#FEE2E2' : '#FEF3C7',
    },
  ]

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Insights
        </Text>
        <View style={styles.insightsContainer}>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={[styles.iconContainer, { backgroundColor: insight.bgColor }]}>
                <MaterialCommunityIcons name={insight.icon as any} size={20} color={insight.color} />
              </View>
              <View style={styles.insightContent}>
                <Text variant="labelSmall" style={styles.insightLabel}>
                  {insight.label}
                </Text>
                <Text variant="bodyMedium" style={[styles.insightValue, { color: insight.color }]}>
                  {insight.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.xl,
    elevation: ELEVATION.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  insightsContainer: {
    gap: SPACING.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brandPurple,
    paddingLeft: SPACING.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  insightValue: {
    fontWeight: '600',
    fontSize: 14,
  },
})

