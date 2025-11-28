import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
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

interface AlertsSectionProps {
  branches: Branch[]
  studentStats: StudentStats | null
}

export function AlertsSection({ branches, studentStats }: AlertsSectionProps) {
  const router = useRouter()
  const hasInactiveBranches = branches.some((b) => b.status !== 'active')
  const hasIncompleteProfiles = studentStats && studentStats.profileIncomplete > 0

  if (!hasInactiveBranches && !hasIncompleteProfiles) {
    return null
  }

  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Alerts
      </Text>
      {hasInactiveBranches && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(admin)/(tabs)/branches')}
        >
          <Card style={styles.alertCard}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.alertGradient}
            >
              <Card.Content style={styles.alertContent}>
                <View style={styles.alertRow}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="alert-circle" size={24} color="#D97706" />
                  </View>
                  <View style={styles.alertTextContainer}>
                    <Text variant="bodyLarge" style={styles.alertTitle}>
                      Inactive branches detected
                    </Text>
                    <Text variant="bodySmall" style={styles.alertSubtitle}>
                      Review branches that are marked as inactive. Tap to view.
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#D97706" />
                </View>
              </Card.Content>
            </LinearGradient>
          </Card>
        </TouchableOpacity>
      )}
      {hasIncompleteProfiles && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(admin)/(tabs)/students')}
        >
          <Card style={styles.alertCard}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.alertGradient}
            >
              <Card.Content style={styles.alertContent}>
                <View style={styles.alertRow}>
                  <View style={[styles.iconCircle, styles.iconCircleRed]}>
                    <MaterialCommunityIcons name="account-alert" size={24} color="#DC2626" />
                  </View>
                  <View style={styles.alertTextContainer}>
                    <Text variant="bodyLarge" style={styles.alertTitle}>
                      {studentStats.profileIncomplete} student profiles incomplete
                    </Text>
                    <Text variant="bodySmall" style={styles.alertSubtitle}>
                      Encourage admins to complete student profiles. Tap to view.
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#DC2626" />
                </View>
              </Card.Content>
            </LinearGradient>
          </Card>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  alertCard: {
    marginBottom: SPACING.md,
    elevation: 3,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  alertGradient: {
    borderRadius: RADIUS.lg,
  },
  alertContent: {
    padding: SPACING.lg,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleRed: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  alertSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
})
