import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, Card, ActivityIndicator } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentFees, type StudentFee, type FeeType, type FeeStatus } from '@/lib/fees'
import { getStudentByUserId } from '@/lib/students'
import { logger } from '@/lib/logger'
import { StudentHeader } from '@/components/student/StudentHeader'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  registration: 'Registration',
  monthly: 'Monthly',
  yearly: 'Yearly',
  grading: 'Grading',
}

const STATUS_GRADIENTS: Record<FeeStatus, string[]> = {
  pending: ['#F59E0B', '#D97706'],
  paid: ['#10B981', '#059669'],
  overdue: ['#EF4444', '#DC2626'],
}

const STATUS_ICONS: Record<FeeStatus, string> = {
  pending: 'clock-outline',
  paid: 'check-circle',
  overdue: 'alert-circle',
}

export default function MyFeesScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [fees, setFees] = useState<StudentFee[]>([])
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
      const result = await getStudentFees(studentId)

      if (result.error) {
        logger.error('Error loading fees', result.error)
        return
      }

      setFees(result.fees || [])
    } catch (error) {
      logger.error('Unexpected error loading fees', error as Error)
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


  // Calculate statistics
  const pendingFees = fees.filter((f) => f.status === 'pending')
  const overdueFees = fees.filter((f) => f.status === 'overdue')
  const paidFees = fees.filter((f) => f.status === 'paid')
  const totalPending = pendingFees.reduce((sum, f) => sum + (f.amount - f.paid_amount), 0)
  const totalOverdue = overdueFees.reduce((sum, f) => sum + (f.amount - f.paid_amount), 0)

  if (loading && !studentId) {
    return (
      <View style={styles.container}>
        <StudentHeader title="My Fees" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brandPurple} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StudentHeader 
        title="My Fees"
        subtitle="View your fee status and payment history"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Statistics Cards */}
        {(totalPending > 0 || totalOverdue > 0) && (
          <View style={styles.statsContainer}>
            {totalPending > 0 && (
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.warning} />
                  <View style={styles.statInfo}>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Pending
                    </Text>
                    <Text variant="titleLarge" style={styles.statAmount}>
                      ₹{totalPending.toFixed(2)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
            {totalOverdue > 0 && (
              <Card style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
                <Card.Content style={styles.statContent}>
                  <MaterialCommunityIcons name="alert-circle" size={32} color={COLORS.error} />
                  <View style={styles.statInfo}>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Overdue
                    </Text>
                    <Text variant="titleLarge" style={[styles.statAmount, { color: COLORS.error }]}>
                      ₹{totalOverdue.toFixed(2)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brandPurple} />
          </View>
        ) : fees.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="cash-off" size={64} color={COLORS.textTertiary} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Fees Yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Your fees will appear here once they are assigned
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            {fees.map((fee) => {
              const statusGradient = STATUS_GRADIENTS[fee.status]
              const statusIcon = STATUS_ICONS[fee.status]
              const remaining = fee.amount - fee.paid_amount
              const isFullyPaid = remaining <= 0

              return (
                <TouchableOpacity
                  key={fee.id}
                  activeOpacity={0.8}
                  style={styles.feeContainer}
                >
                  <LinearGradient
                    colors={statusGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.feeBanner}
                  >
                    <View style={styles.bannerContent}>
                      <View style={styles.bannerLeft}>
                        <View style={styles.iconContainer}>
                          <MaterialCommunityIcons name={statusIcon as any} size={28} color="#fff" />
                        </View>
                        <View style={styles.textContainer}>
                          <View style={styles.titleRow}>
                            <Text variant="titleLarge" style={styles.feeType} numberOfLines={1}>
                              {FEE_TYPE_LABELS[fee.fee_type]}
                            </Text>
                            <View style={styles.statusBadge}>
                              <Text style={styles.statusText}>
                                {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.amountRow}>
                            <View>
                              <Text variant="bodySmall" style={styles.amountLabel}>
                                Total Amount
                              </Text>
                              <Text variant="headlineSmall" style={styles.totalAmount}>
                                ₹{fee.amount.toFixed(2)}
                              </Text>
                            </View>
                            {fee.paid_amount > 0 && (
                              <View style={styles.paidAmountContainer}>
                                <Text variant="bodySmall" style={styles.amountLabel}>
                                  Paid
                                </Text>
                                <Text variant="titleLarge" style={styles.paidAmount}>
                                  ₹{fee.paid_amount.toFixed(2)}
                                </Text>
                              </View>
                            )}
                          </View>

                          {remaining > 0 && (
                            <View style={styles.remainingContainer}>
                              <Text variant="bodySmall" style={styles.remainingLabel}>
                                Remaining:
                              </Text>
                              <Text variant="titleMedium" style={styles.remainingAmount}>
                                ₹{remaining.toFixed(2)}
                              </Text>
                            </View>
                          )}

                          <View style={styles.dateRow}>
                            <MaterialCommunityIcons name="calendar" size={14} color="rgba(255, 255, 255, 0.9)" />
                            <Text variant="labelSmall" style={styles.dueDate}>
                              Due: {format(new Date(fee.due_date), 'MMM dd, yyyy')}
                            </Text>
                            {fee.paid_at && (
                              <>
                                <Text style={styles.separator}>•</Text>
                                <Text variant="labelSmall" style={styles.paidDate}>
                                  Paid {formatDistanceToNow(new Date(fee.paid_at), { addSuffix: true })}
                                </Text>
                              </>
                            )}
                          </View>

                          {fee.status === 'overdue' && (
                            <View style={styles.overdueWarning}>
                              <MaterialCommunityIcons name="alert" size={16} color="#fff" />
                              <Text variant="bodySmall" style={styles.overdueText}>
                                This fee is overdue. Please contact your branch admin.
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )
            })}
            <View style={styles.bottomPadding} />
          </>
        )}
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
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    elevation: ELEVATION.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontSize: 12,
  },
  statAmount: {
    fontWeight: 'bold',
    color: COLORS.warning,
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
  // Fee Banner Styles (gradient design)
  feeContainer: {
    marginBottom: SPACING.md,
  },
  feeBanner: {
    borderRadius: RADIUS.md,
    elevation: ELEVATION.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  feeType: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },
  amountLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginBottom: 2,
  },
  totalAmount: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 28,
  },
  paidAmountContainer: {
    alignItems: 'flex-end',
  },
  paidAmount: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 22,
  },
  remainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  remainingLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
  remainingAmount: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  dueDate: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
  },
  separator: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  paidDate: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  overdueText: {
    color: '#fff',
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
})

