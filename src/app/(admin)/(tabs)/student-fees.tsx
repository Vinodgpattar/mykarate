import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, Searchbar, Menu, FAB } from 'react-native-paper'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getAllFees, type StudentFee, type FeeType, type FeeStatus } from '@/lib/fees'
import { getBranches, type Branch } from '@/lib/branches'
import { getProfileByUserId } from '@/lib/profiles'
import { logger } from '@/lib/logger'
import { AdminHeader } from '@/components/admin/AdminHeader'

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  registration: 'Registration',
  monthly: 'Monthly',
  yearly: 'Yearly',
  grading: 'Grading',
}

const STATUS_COLORS: Record<FeeStatus, string> = {
  pending: '#F59E0B',
  paid: '#10B981',
  overdue: '#DC2626',
}

export default function StudentFeesScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const studentIdFromParams = params.studentId as string | undefined

  const [fees, setFees] = useState<any[]>([])
  const [filteredFees, setFilteredFees] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FeeStatus | 'all'>('all')
  const [feeTypeFilter, setFeeTypeFilter] = useState<FeeType | 'all'>('all')
  const [branchFilter, setBranchFilter] = useState<string | 'all'>('all')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)
  const [statusMenuVisible, setStatusMenuVisible] = useState(false)
  const [typeMenuVisible, setTypeMenuVisible] = useState(false)
  const [branchMenuVisible, setBranchMenuVisible] = useState(false)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    loadUserProfile()
  }, [user])

  useEffect(() => {
    if (user) {
      loadData()
      loadBranches()
    }
  }, [user, statusFilter, feeTypeFilter, branchFilter, studentIdFromParams])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return
      
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
    }, [user, statusFilter, feeTypeFilter, branchFilter, studentIdFromParams])
  )

  useEffect(() => {
    applyFilters()
  }, [fees, searchQuery, statusFilter, feeTypeFilter, branchFilter])

  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      const result = await getProfileByUserId(user.id)
      if (result.profile) {
        setIsSuperAdmin(result.profile.role === 'super_admin')
        setUserBranchId(result.profile.branchId)
        if (!isSuperAdmin && result.profile.branchId) {
          setBranchFilter(result.profile.branchId)
        }
      }
    } catch (error) {
      logger.error('Error loading user profile', error as Error)
    }
  }

  const loadBranches = async () => {
    try {
      const result = await getBranches()
      if (result.branches) {
        setBranches(result.branches as Branch[])
      }
    } catch (error) {
      logger.error('Error loading branches', error as Error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getAllFees({
        studentId: studentIdFromParams, // Filter by student if provided
        branchId: branchFilter !== 'all' ? branchFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        feeType: feeTypeFilter !== 'all' ? feeTypeFilter : undefined,
      })

      if (result.error) {
        logger.error('Error loading fees', result.error)
        setFees([]) // Set empty array on error
        return
      }

      setFees(result.fees || [])
    } catch (error) {
      logger.error('Unexpected error loading fees', error as Error)
      setFees([]) // Set empty array on error
    } finally {
      setLoading(false)
      setRefreshing(false)
      lastLoadTimeRef.current = Date.now()
    }
  }

  const applyFilters = () => {
    let filtered = [...fees]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((fee: any) => {
        const studentName = fee.student
          ? `${fee.student.first_name} ${fee.student.last_name}`.toLowerCase()
          : ''
        const studentId = fee.student?.student_id?.toLowerCase() || ''
        return studentName.includes(query) || studentId.includes(query)
      })
    }

    setFilteredFees(filtered)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const getStatusBadge = (status: FeeStatus) => {
    return (
      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] }]}>
        <Text variant="labelSmall" style={styles.statusText}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    )
  }

  const getStudentName = (fee: any) => {
    if (fee.student) {
      return `${fee.student.first_name} ${fee.student.last_name}`
    }
    return 'Unknown Student'
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title={studentIdFromParams ? 'Student Fees' : 'All Student Fees'}
        subtitle={studentIdFromParams ? 'View and manage fees for this student' : 'View and manage all student fees'}
      />

      <View style={styles.filters}>
        <Searchbar
          placeholder="Search by student name or ID..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => {
                  if (statusMenuVisible) {
                    setStatusMenuVisible(false)
                  } else {
                    setTimeout(() => setStatusMenuVisible(true), 50)
                  }
                }}
                style={styles.filterButton}
                icon="filter"
              >
                {statusFilter === 'all' ? 'All Status' : statusFilter}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setStatusFilter('all'); setStatusMenuVisible(false); loadData() }} title="All Status" />
            <Menu.Item onPress={() => { setStatusFilter('pending'); setStatusMenuVisible(false); loadData() }} title="Pending" />
            <Menu.Item onPress={() => { setStatusFilter('paid'); setStatusMenuVisible(false); loadData() }} title="Paid" />
            <Menu.Item onPress={() => { setStatusFilter('overdue'); setStatusMenuVisible(false); loadData() }} title="Overdue" />
          </Menu>

          <Menu
            visible={typeMenuVisible}
            onDismiss={() => setTypeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => {
                  if (typeMenuVisible) {
                    setTypeMenuVisible(false)
                  } else {
                    setTimeout(() => setTypeMenuVisible(true), 50)
                  }
                }}
                style={styles.filterButton}
                icon="cash-multiple"
              >
                {feeTypeFilter === 'all' ? 'All Types' : FEE_TYPE_LABELS[feeTypeFilter]}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setFeeTypeFilter('all'); setTypeMenuVisible(false); loadData() }} title="All Types" />
            <Menu.Item onPress={() => { setFeeTypeFilter('registration'); setTypeMenuVisible(false); loadData() }} title="Registration" />
            <Menu.Item onPress={() => { setFeeTypeFilter('monthly'); setTypeMenuVisible(false); loadData() }} title="Monthly" />
            <Menu.Item onPress={() => { setFeeTypeFilter('yearly'); setTypeMenuVisible(false); loadData() }} title="Yearly" />
            <Menu.Item onPress={() => { setFeeTypeFilter('grading'); setTypeMenuVisible(false); loadData() }} title="Grading" />
          </Menu>

          {isSuperAdmin && (
            <Menu
              visible={branchMenuVisible}
              onDismiss={() => setBranchMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (branchMenuVisible) {
                      setBranchMenuVisible(false)
                    } else {
                      setTimeout(() => setBranchMenuVisible(true), 50)
                    }
                  }}
                  style={styles.filterButton}
                  icon="office-building"
                >
                  {branchFilter === 'all' ? 'All Branches' : branches.find((b) => b.id === branchFilter)?.name || 'Branch'}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setBranchFilter('all'); setBranchMenuVisible(false); loadData() }} title="All Branches" />
              {branches.map((branch) => (
                <Menu.Item
                  key={branch.id}
                  onPress={() => {
                    setBranchFilter(branch.id)
                    setBranchMenuVisible(false)
                    loadData()
                  }}
                  title={branch.name}
                />
              ))}
            </Menu>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
          </View>
        ) : filteredFees.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="cash-off" size={64} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Fees Found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all' || feeTypeFilter !== 'all'
                  ? 'No fees match your filters'
                  : 'No student fees yet'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredFees.map((fee: any) => (
            <TouchableOpacity
              key={fee.id}
              onPress={() => router.push(`/(admin)/(tabs)/record-payment?id=${fee.id}`)}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.studentInfo}>
                      <View style={styles.studentDetails}>
                        <Text variant="titleMedium" style={styles.studentName}>
                          {getStudentName(fee)}
                        </Text>
                        {fee.student?.student_id && (
                          <Text variant="bodySmall" style={styles.studentId}>
                            {fee.student.student_id}
                          </Text>
                        )}
                      </View>
                    </View>
                    {getStatusBadge(fee.status)}
                  </View>
                  <View style={styles.feeDetails}>
                    <View style={styles.feeRow}>
                      <Text variant="bodySmall" style={styles.feeLabel}>
                        Type:
                      </Text>
                      <Text variant="bodyMedium" style={styles.feeValue}>
                        {FEE_TYPE_LABELS[fee.fee_type]}
                      </Text>
                    </View>
                    <View style={styles.feeRow}>
                      <Text variant="bodySmall" style={styles.feeLabel}>
                        Amount:
                      </Text>
                      <Text variant="bodyMedium" style={styles.feeAmount}>
                        ₹{fee.amount.toFixed(2)}
                      </Text>
                    </View>
                    {fee.paid_amount > 0 && (
                      <View style={styles.feeRow}>
                        <Text variant="bodySmall" style={styles.feeLabel}>
                          Paid:
                        </Text>
                        <Text variant="bodyMedium" style={styles.feeValue}>
                          ₹{fee.paid_amount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.feeRow}>
                      <Text variant="bodySmall" style={styles.feeLabel}>
                        Due Date:
                      </Text>
                      <Text variant="bodyMedium" style={styles.feeValue}>
                        {format(new Date(fee.due_date), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                  </View>
                  {fee.status === 'pending' && (
                    <Button
                      mode="contained"
                      onPress={() => router.push(`/(admin)/(tabs)/record-payment?id=${fee.id}`)}
                      style={styles.recordButton}
                      buttonColor="#7B2CBF"
                      icon="cash-check"
                    >
                      Record Payment
                    </Button>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  filters: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchbar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#F9FAFB',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    minWidth: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCard: {
    marginTop: 40,
    elevation: 0,
    backgroundColor: '#FFFFFF',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#1A1A1A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingHorizontal: 20,
  },
  card: {
    marginBottom: 12,
    elevation: 1,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  studentId: {
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  feeDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    color: '#6B7280',
  },
  feeValue: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  feeAmount: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  recordButton: {
    marginTop: 12,
  },
})

