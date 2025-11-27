import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'

interface Alert {
  type: 'error' | 'warning' | 'info'
  icon: string
  title: string
  message: string
  actionLabel?: string
  actionRoute?: string
}

interface AlertsSectionProps {
  overdueFees: number
  profileCompletion: number
  lowAttendance?: boolean
  upcomingFeeDue?: string
}

export function AlertsSection({
  overdueFees,
  profileCompletion,
  lowAttendance = false,
  upcomingFeeDue,
}: AlertsSectionProps) {
  const router = useRouter()

  const alerts: Alert[] = []

  // Overdue fees alert
  if (overdueFees > 0) {
    alerts.push({
      type: 'error',
      icon: 'alert-circle',
      title: 'Overdue Fees',
      message: `You have ₹${overdueFees.toLocaleString()} in overdue fees. Please pay immediately.`,
      actionLabel: 'Pay Now',
      actionRoute: '/(student)/(tabs)/my-fees',
    })
  }

  // Incomplete profile alert
  if (profileCompletion < 100) {
    alerts.push({
      type: 'warning',
      icon: 'account-alert',
      title: 'Complete Your Profile',
      message: `Your profile is ${profileCompletion}% complete. Complete it to unlock all features.`,
      actionLabel: 'Complete Profile',
      actionRoute: '/(student)/(tabs)/complete-profile',
    })
  }

  // Low attendance warning
  if (lowAttendance) {
    alerts.push({
      type: 'warning',
      icon: 'calendar-alert',
      title: 'Low Attendance',
      message: 'Your attendance is below the required threshold. Please attend more classes.',
      actionLabel: 'View Attendance',
      actionRoute: '/(student)/(tabs)/my-attendance',
    })
  }

  // Upcoming fee due
  if (upcomingFeeDue) {
    alerts.push({
      type: 'info',
      icon: 'calendar-clock',
      title: 'Fee Due Soon',
      message: `You have a fee due on ${upcomingFeeDue}. Please prepare for payment.`,
      actionLabel: 'View Fees',
      actionRoute: '/(student)/(tabs)/my-fees',
    })
  }

  if (alerts.length === 0) {
    return null
  }

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'error':
        return {
          bg: '#FEE2E2',
          border: '#EF4444',
          icon: '#EF4444',
          text: '#991B1B',
        }
      case 'warning':
        return {
          bg: '#FEF3C7',
          border: '#F59E0B',
          icon: '#F59E0B',
          text: '#92400E',
        }
      default:
        return {
          bg: '#DBEAFE',
          border: '#3B82F6',
          icon: '#3B82F6',
          text: '#1E40AF',
        }
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Important Alerts
      </Text>
      {alerts.map((alert, index) => {
        const colors = getAlertColors(alert.type)
        return (
          <Card
            key={index}
            style={[
              styles.alertCard,
              {
                backgroundColor: colors.bg,
                borderLeftColor: colors.border,
              },
            ]}
          >
            <Card.Content style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <MaterialCommunityIcons name={alert.icon as any} size={24} color={colors.icon} />
                <View style={styles.alertTextContainer}>
                  <Text variant="titleSmall" style={[styles.alertTitle, { color: colors.text }]}>
                    {alert.title}
                  </Text>
                  <Text variant="bodySmall" style={[styles.alertMessage, { color: colors.text }]}>
                    {alert.message}
                  </Text>
                </View>
              </View>
              {alert.actionLabel && alert.actionRoute && (
                <Button
                  mode="contained"
                  onPress={() => router.push(alert.actionRoute as any)}
                  style={styles.actionButton}
                  buttonColor={colors.border}
                  compact
                >
                  {alert.actionLabel}
                </Button>
              )}
            </Card.Content>
          </Card>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  alertCard: {
    marginBottom: SPACING.md,
    elevation: ELEVATION.sm,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
  },
  alertContent: {
    padding: SPACING.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  alertTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  alertTitle: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  alertMessage: {
    opacity: 0.9,
    lineHeight: 18,
  },
  actionButton: {
    marginTop: SPACING.sm,
  },
})


