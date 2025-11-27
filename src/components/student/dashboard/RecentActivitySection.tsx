import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'
import { type AttendanceRecord } from '@/lib/attendance'
import { type StudentFee } from '@/lib/fees'

interface RecentActivitySectionProps {
  recentAttendance: AttendanceRecord[]
  recentFees: StudentFee[]
}

export function RecentActivitySection({
  recentAttendance,
  recentFees,
}: RecentActivitySectionProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
      case 'paid':
        return '#10B981'
      case 'absent':
      case 'overdue':
        return '#EF4444'
      case 'leave':
      case 'pending':
        return '#F59E0B'
      default:
        return COLORS.textSecondary
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'check-circle'
      case 'absent':
        return 'close-circle'
      case 'leave':
        return 'calendar-clock'
      case 'paid':
        return 'check-circle'
      case 'overdue':
        return 'alert-circle'
      case 'pending':
        return 'clock-outline'
      default:
        return 'circle'
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Recent Activity
      </Text>

      {/* Recent Attendance */}
      {recentAttendance.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={COLORS.brandPurple} />
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Attendance
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(student)/(tabs)/my-attendance')}
              style={styles.viewAllButton}
            >
              <Text variant="labelSmall" style={styles.viewAllText}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          {recentAttendance.slice(0, 3).map((record) => (
            <Card key={record.id} style={styles.activityCard}>
              <Card.Content style={styles.activityContent}>
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.statusIcon,
                      { backgroundColor: `${getStatusColor(record.status)}20` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getStatusIcon(record.status) as any}
                      size={20}
                      color={getStatusColor(record.status)}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text variant="bodyMedium" style={styles.activityTitle}>
                      {format(new Date(record.class_date), 'MMM dd, yyyy')}
                    </Text>
                    <Text variant="bodySmall" style={styles.activitySubtitle}>
                      Status: {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(record.status)}20` },
                  ]}
                >
                  <Text
                    variant="labelSmall"
                    style={[styles.statusText, { color: getStatusColor(record.status) }]}
                  >
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Recent Fees */}
      {recentFees.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={COLORS.brandPurple} />
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Fees
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(student)/(tabs)/my-fees')}
              style={styles.viewAllButton}
            >
              <Text variant="labelSmall" style={styles.viewAllText}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          {recentFees.slice(0, 3).map((fee) => (
            <Card key={fee.id} style={styles.activityCard}>
              <Card.Content style={styles.activityContent}>
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.statusIcon,
                      { backgroundColor: `${getStatusColor(fee.status)}20` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getStatusIcon(fee.status) as any}
                      size={20}
                      color={getStatusColor(fee.status)}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text variant="bodyMedium" style={styles.activityTitle}>
                      {fee.fee_type.charAt(0).toUpperCase() + fee.fee_type.slice(1)} Fee
                    </Text>
                    <Text variant="bodySmall" style={styles.activitySubtitle}>
                      ₹{fee.amount.toLocaleString()} • Due: {format(new Date(fee.due_date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(fee.status)}20` },
                  ]}
                >
                  <Text
                    variant="labelSmall"
                    style={[styles.statusText, { color: getStatusColor(fee.status) }]}
                  >
                    {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {recentAttendance.length === 0 && recentFees.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="inbox" size={48} color={COLORS.textTertiary} />
            <Text variant="bodyMedium" style={styles.emptyText}>
              No recent activity
            </Text>
          </Card.Content>
        </Card>
      )}
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAllButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  viewAllText: {
    color: COLORS.brandPurple,
    fontWeight: '600',
  },
  activityCard: {
    marginBottom: SPACING.sm,
    elevation: ELEVATION.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  activitySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  emptyCard: {
    elevation: ELEVATION.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  emptyContent: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
})


