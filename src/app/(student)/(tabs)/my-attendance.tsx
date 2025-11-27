import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import {
  getStudentAttendance,
  getStudentAttendanceStats,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/lib/attendance'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { logger } from '@/lib/logger'
import { StudentHeader } from '@/components/student/StudentHeader'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'

export default function MyAttendanceScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<{
    totalClasses: number
    presentCount: number
    absentCount: number
    leaveCount: number
    attendancePercentage: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    loadStudent()
  }, [user])

  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [studentId])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!studentId) return
      
      // Skip if just loaded or currently loading
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
      if (isLoadingRef.current || timeSinceLastLoad < 1000) {
        return
      }

      // Reload data
      isLoadingRef.current = true
      loadData().finally(() => {
        isLoadingRef.current = false
        lastLoadTimeRef.current = Date.now()
      })
    }, [studentId])
  )

  const loadStudent = async () => {
    if (!user?.id) return

    try {
      const result = await getStudentByUserId(user.id)
      if (result.student) {
        setStudentId(result.student.id)
      }
    } catch (error) {
      logger.error('Error loading student', error as Error)
    }
  }

  const loadData = async () => {
    if (!studentId) return

    try {
      setLoading(true)

      const [recordsResult, statsResult] = await Promise.all([
        getStudentAttendance(studentId, { limit: 100 }),
        getStudentAttendanceStats(studentId),
      ])

      if (recordsResult.error) {
        logger.error('Error loading attendance records', recordsResult.error)
        return
      }

      if (statsResult.error) {
        logger.error('Error loading attendance stats', statsResult.error)
        return
      }

      setAttendanceRecords(recordsResult.records || [])
      setStats(statsResult.stats)
    } catch (error) {
      logger.error('Unexpected error loading attendance', error as Error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      lastLoadTimeRef.current = Date.now()
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return (
          <Chip
            icon="check-circle"
            style={[styles.statusChip, { backgroundColor: COLORS.success }]}
            textStyle={styles.statusChipText}
          >
            Present
          </Chip>
        )
      case 'absent':
        return (
          <Chip
            icon="close-circle"
            style={[styles.statusChip, { backgroundColor: COLORS.error }]}
            textStyle={styles.statusChipText}
          >
            Absent
          </Chip>
        )
      case 'leave':
        return (
          <Chip
            icon="calendar-clock"
            style={[styles.statusChip, { backgroundColor: COLORS.warning }]}
            textStyle={styles.statusChipText}
          >
            Leave
          </Chip>
        )
    }
  }

  if (loading && !studentId) {
    return (
      <View style={styles.container}>
        <StudentHeader title="My Attendance" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brandPurple} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StudentHeader 
        title="My Attendance"
        subtitle="Track your class attendance"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {stats && (
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {stats.attendancePercentage}%
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Attendance
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {stats.totalClasses}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Total Classes
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={[styles.statValue, { color: COLORS.success }]}>
                    {stats.presentCount}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Present
                  </Text>
                </View>
              </View>

              <View style={styles.statsBreakdown}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: COLORS.success }]} />
                  <Text variant="bodySmall" style={styles.breakdownText}>
                    Present: {stats.presentCount}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: COLORS.error }]} />
                  <Text variant="bodySmall" style={styles.breakdownText}>
                    Absent: {stats.absentCount}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: COLORS.warning }]} />
                  <Text variant="bodySmall" style={styles.breakdownText}>
                    Leave: {stats.leaveCount}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Classes
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brandPurple} />
          </View>
        ) : attendanceRecords.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={COLORS.textTertiary} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Attendance Records
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Your attendance will appear here once marked by your teacher
              </Text>
            </Card.Content>
          </Card>
        ) : (
          attendanceRecords.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <Card.Content>
                <View style={styles.recordHeader}>
                  <View style={styles.recordDate}>
                    <Text variant="titleMedium" style={styles.dateText}>
                      {format(new Date(record.class_date), 'MMM dd, yyyy')}
                    </Text>
                    <Text variant="bodySmall" style={styles.dateAgo}>
                      {formatDistanceToNow(new Date(record.class_date), { addSuffix: true })}
                    </Text>
                  </View>
                  {getStatusBadge(record.status)}
                </View>
                {record.notes && (
                  <View style={styles.notesContainer}>
                    <Text variant="bodySmall" style={styles.notesLabel}>
                      Notes:
                    </Text>
                    <Text variant="bodySmall" style={styles.notesText}>
                      {record.notes}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
  statsCard: {
    marginBottom: SPACING.xl,
    elevation: ELEVATION.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    color: COLORS.brandPurple,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  statsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyCard: {
    marginTop: SPACING.xl,
    elevation: ELEVATION.none,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xl,
  },
  recordCard: {
    marginBottom: SPACING.md,
    elevation: ELEVATION.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDate: {
    flex: 1,
  },
  dateText: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  dateAgo: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontSize: 12,
  },
  notesText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
})

