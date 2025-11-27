import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, Card, ActivityIndicator, Chip, FAB } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { getStudentLeaveInforms, type LeaveInform } from '@/lib/student-leave-informs'
import { logger } from '@/lib/logger'
import { StudentHeader } from '@/components/student/StudentHeader'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'

export default function InformLeaveScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [informs, setInforms] = useState<LeaveInform[]>([])
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
      const result = await getStudentLeaveInforms(studentId)

      if (result.error) {
        logger.error('Error loading leave informs', result.error)
        return
      }

      setInforms(result.informs || [])
    } catch (error) {
      logger.error('Unexpected error loading leave informs', error as Error)
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

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <Chip
          icon="check-circle"
          style={[styles.statusChip, { backgroundColor: '#10B981' }]}
          textStyle={styles.statusChipText}
        >
          Approved
        </Chip>
      )
    }
    return (
      <Chip
        icon="clock-outline"
        style={[styles.statusChip, { backgroundColor: '#F59E0B' }]}
        textStyle={styles.statusChipText}
      >
        Pending
      </Chip>
    )
  }

  if (loading && !studentId) {
    return (
      <View style={styles.container}>
        <StudentHeader title="Inform Leave" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brandPurple} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StudentHeader 
        title="Inform Leave"
        subtitle="Let your teacher know when you can't attend class"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
          </View>
        ) : informs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-clock-outline" size={64} color={COLORS.textTertiary} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Leave Informs Yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Tap the + button to inform your teacher about your absence
              </Text>
            </Card.Content>
          </Card>
        ) : (
          informs.map((inform) => (
            <Card key={inform.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  {getStatusBadge(inform.status)}
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {formatDistanceToNow(new Date(inform.created_at), { addSuffix: true })}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.message}>
                  {inform.message}
                </Text>
                {inform.approved_at && (
                  <View style={styles.approvedInfo}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text variant="bodySmall" style={styles.approvedText}>
                      Approved {formatDistanceToNow(new Date(inform.approved_at), { addSuffix: true })}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + SPACING.lg }]}
        onPress={() => router.push('/(student)/(tabs)/create-leave-inform')}
        label="Inform"
        color={COLORS.surface}
      />
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
    height: 80,
  },
  emptyCard: {
    marginTop: SPACING.xxl,
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
  card: {
    marginBottom: SPACING.md,
    elevation: ELEVATION.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
  timestamp: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  message: {
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  approvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  approvedText: {
    color: COLORS.success,
    fontWeight: '500',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    backgroundColor: COLORS.brandPurple,
  },
})

