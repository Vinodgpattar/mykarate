import { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Snackbar, Searchbar, Chip, Avatar, FAB } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getStudents, deleteStudent, reactivateStudent, getStudentStatistics, type Student } from '@/lib/students'
import { DeleteStudentDialog } from '@/components/shared/DeleteStudentDialog'
import { getBranches, type Branch } from '@/lib/branches'
import { getProfileByUserId } from '@/lib/profiles'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { logger } from '@/lib/logger'

interface StudentStats {
  total: number
  active: number
  inactive: number
  profileCompleted: number
  profileIncomplete: number
}

import { BELT_COLORS, getBeltDisplayName } from '@/lib/belts'

export default function StudentsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('')
  const [beltFilter, setBeltFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; studentId: string | null; studentName: string }>({
    visible: false,
    studentId: null,
    studentName: '',
  })
  const [deleting, setDeleting] = useState(false)
  const [reactivating, setReactivating] = useState<string | null>(null)
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    profileCompleted: 0,
    profileIncomplete: 0,
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    checkRole()
    loadBranches()
    loadData()
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [students, searchQuery, branchFilter, beltFilter, statusFilter])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
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
    }, [userBranchId, statusFilter])
  )

  const checkRole = async () => {
    if (user?.id) {
      const result = await getProfileByUserId(user.id)
      if (result.profile) {
        if (result.profile.role === 'super_admin') {
          setIsSuperAdmin(true)
        } else if (result.profile.role === 'admin' && result.profile.branchId) {
          setUserBranchId(result.profile.branchId)
          setBranchFilter(result.profile.branchId) // Auto-filter to their branch
        }
      }
    }
  }

  const loadBranches = async () => {
    if (isSuperAdmin) {
      const result = await getBranches()
      if (result.branches) {
        setBranches(result.branches as Branch[])
      }
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsResult, statsResult] = await Promise.all([
        getStudents({
          page: 1,
          limit: 20,
          branchId: userBranchId || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        getStudentStatistics(userBranchId || undefined),
      ])

      if (studentsResult.error) {
        setSnackbar({ visible: true, message: studentsResult.error.message })
      } else if (studentsResult.students) {
        setStudents(studentsResult.students)
        setHasMore(studentsResult.students.length >= 20)
        setPage(1)
      }

      if (statsResult.error) {
        logger.error('Error loading statistics', statsResult.error)
      } else {
        setStats({
          total: statsResult.total,
          active: statsResult.active,
          inactive: statsResult.inactive,
          profileCompleted: statsResult.profileCompleted,
          profileIncomplete: statsResult.profileIncomplete,
        })
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load students' })
    } finally {
      setLoading(false)
      setRefreshing(false)
      lastLoadTimeRef.current = Date.now()
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const result = await getStudents({
        page: nextPage,
        limit: 20,
        branchId: userBranchId || branchFilter || undefined,
        belt: beltFilter || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else if (result.students) {
        setStudents((prev) => [...prev, ...result.students!])
        setHasMore(result.students.length >= 20)
        setPage(nextPage)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load more students' })
    } finally {
      setLoadingMore(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...students]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (student) =>
          student.first_name.toLowerCase().includes(query) ||
          student.last_name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.student_id.toLowerCase().includes(query) ||
          student.phone?.toLowerCase().includes(query)
      )
    }

    // Apply branch filter (already applied in query, but filter client-side for search results)
    if (branchFilter && isSuperAdmin) {
      filtered = filtered.filter((student) => student.branch_id === branchFilter)
    }

    // Apply belt filter
    if (beltFilter) {
      filtered = filtered.filter((student) => student.current_belt === beltFilter)
    }

    // Apply status filter (already applied in query, but filter client-side for search results)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) => student.is_active === (statusFilter === 'active'))
    }

    setFilteredStudents(filtered)
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [])

  const handleDeleteClick = (studentId: string, studentName: string) => {
    setDeleteDialog({ visible: true, studentId, studentName })
  }

  const handleDeleteConfirm = async (hardDelete: boolean) => {
    if (!user?.id || !deleteDialog.studentId) return

    setDeleting(true)
    try {
      const result = await deleteStudent(deleteDialog.studentId, hardDelete, user.id)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        setSnackbar({
          visible: true,
          message: hardDelete
            ? `Student "${deleteDialog.studentName}" permanently deleted`
            : `Student "${deleteDialog.studentName}" deactivated successfully`,
        })
        loadData()
        setDeleteDialog({ visible: false, studentId: null, studentName: '' })
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to delete student' })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ visible: false, studentId: null, studentName: '' })
  }

  const handleReactivate = async (studentId: string, studentName: string) => {
    if (!user?.id) return

    setReactivating(studentId)
    try {
      const result = await reactivateStudent(studentId, user.id)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        setSnackbar({ visible: true, message: `Student "${studentName}" reactivated successfully` })
        loadData()
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to reactivate student' })
    } finally {
      setReactivating(null)
    }
  }

  // Get unique belt levels from students
  const beltLevels = Array.from(new Set(students.map((s) => s.current_belt).filter(Boolean)))

  if (loading && students.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <AdminHeader title="Students" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
          const paddingToBottom = 20
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore()
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Statistics Dashboard */}
        <View style={styles.statsSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📊 Statistics
          </Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="account-group" size={24} color="#6366F1" />
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {stats.total}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
                <Text variant="headlineSmall" style={[styles.statNumber, { color: '#10B981' }]}>
                  {stats.active}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Active
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="account-check" size={24} color="#7B2CBF" />
                <Text variant="headlineSmall" style={[styles.statNumber, { color: '#7B2CBF' }]}>
                  {stats.profileCompleted}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Complete
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="account-alert" size={24} color="#F59E0B" />
                <Text variant="headlineSmall" style={[styles.statNumber, { color: '#F59E0B' }]}>
                  {stats.profileIncomplete}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Incomplete
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.filterSection}>
          <Searchbar
            placeholder="Search students..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />

          <View style={styles.filterChips}>
            <Chip
              selected={statusFilter === 'all'}
              onPress={() => setStatusFilter('all')}
              style={styles.chip}
              selectedColor="#7B2CBF"
            >
              All
            </Chip>
            <Chip
              selected={statusFilter === 'active'}
              onPress={() => setStatusFilter('active')}
              style={styles.chip}
              selectedColor="#7B2CBF"
            >
              Active
            </Chip>
            <Chip
              selected={statusFilter === 'inactive'}
              onPress={() => setStatusFilter('inactive')}
              style={styles.chip}
              selectedColor="#7B2CBF"
            >
              Inactive
            </Chip>
          </View>

          {/* Branch Filter (Super Admin only) */}
          {isSuperAdmin && branches.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchFilter}>
              <Chip
                selected={!branchFilter}
                onPress={() => setBranchFilter('')}
                style={styles.chip}
                selectedColor="#7B2CBF"
              >
                All Branches
              </Chip>
              {branches.map((branch) => (
                <Chip
                  key={branch.id}
                  selected={branchFilter === branch.id}
                  onPress={() => setBranchFilter(branchFilter === branch.id ? '' : branch.id)}
                  style={styles.chip}
                  selectedColor="#7B2CBF"
                >
                  {branch.name}
                </Chip>
              ))}
            </ScrollView>
          )}

          {/* Belt Filter */}
          {beltLevels.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beltFilter}>
              <Chip
                selected={!beltFilter}
                onPress={() => setBeltFilter('')}
                style={styles.chip}
                selectedColor="#7B2CBF"
              >
                All Belts
              </Chip>
              {beltLevels.map((belt) => (
                <Chip
                  key={belt}
                  selected={beltFilter === belt}
                  onPress={() => setBeltFilter(beltFilter === belt ? '' : belt)}
                  style={styles.chip}
                  selectedColor="#7B2CBF"
                >
                  {belt}
                </Chip>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Students List */}
        <View style={styles.content}>
          {filteredStudents.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="account-outline" size={64} color="#9CA3AF" />
                <Text variant="titleMedium" style={styles.emptyText}>
                  No students found
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  {searchQuery || branchFilter || beltFilter || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first student to get started'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onView={() => router.push(`/(admin)/(tabs)/student-profile?id=${student.id}`)}
                onEdit={() => router.push(`/(admin)/(tabs)/edit-student?id=${student.id}`)}
                onDelete={() => handleDeleteClick(student.id, `${student.first_name} ${student.last_name}`)}
                onReactivate={() => handleReactivate(student.id, `${student.first_name} ${student.last_name}`)}
                reactivating={reactivating === student.id}
              />
            ))
          )}

          {/* Load More */}
          {hasMore && filteredStudents.length > 0 && (
            <View style={styles.loadMoreContainer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color="#7B2CBF" />
              ) : (
                <Button mode="text" onPress={loadMore} textColor="#7B2CBF">
                  Load More
                </Button>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(admin)/(tabs)/create-student')}
        label="Add Student"
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>

      <DeleteStudentDialog
        visible={deleteDialog.visible}
        studentName={deleteDialog.studentName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </View>
  )
}

// Student Card Component
function StudentCard({
  student,
  onView,
  onEdit,
  onDelete,
  onReactivate,
  reactivating,
}: {
  student: Student
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onReactivate: () => void
  reactivating?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card style={styles.studentCard}>
      <Card.Content>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
          <View style={styles.studentHeader}>
            <View style={styles.studentInfo}>
              {student.student_photo_url ? (
                <Image
                  source={{ uri: student.student_photo_url }}
                  style={styles.studentPhoto}
                />
              ) : (
                <Avatar.Text
                  size={48}
                  label={`${student.first_name[0]}${student.last_name[0]}`}
                  style={styles.avatar}
                />
              )}
              <View style={styles.studentDetails}>
                <Text variant="titleMedium" style={styles.studentName}>
                  {student.first_name} {student.last_name}
                </Text>
                <Text variant="bodySmall" style={styles.studentId}>
                  {student.student_id}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.beltBadge,
                      { backgroundColor: BELT_COLORS[student.current_belt] || '#E5E7EB' },
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.beltText,
                        { color: student.current_belt === 'White' || student.current_belt === 'Yellow' ? '#000' : '#FFF' },
                      ]}
                    >
                      {getBeltDisplayName(student.current_belt)}
                    </Text>
                  </View>
                  {!student.profile_completed && (
                    <View style={styles.incompleteBadge}>
                      <MaterialCommunityIcons name="alert-circle" size={12} color="#F59E0B" />
                      <Text variant="labelSmall" style={styles.incompleteText}>
                        Incomplete
                      </Text>
                    </View>
                  )}
                  {!student.is_active && (
                    <View style={styles.inactiveBadge}>
                      <Text variant="labelSmall" style={styles.inactiveText}>
                        Inactive
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="email" size={18} color="#6B7280" />
              <Text variant="bodySmall" style={styles.detailText}>
                {student.email}
              </Text>
            </View>
            {student.phone && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="phone" size={18} color="#6B7280" />
                <Text variant="bodySmall" style={styles.detailText}>
                  {student.phone}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
              <Text variant="bodySmall" style={styles.detailText}>
                Joined: {format(new Date(student.created_at), 'MMM dd, yyyy')}
              </Text>
            </View>

            <View style={styles.studentActions}>
              <Button mode="outlined" onPress={onView} style={styles.actionButton} icon="eye">
                View
              </Button>
              <Button mode="outlined" onPress={onEdit} style={styles.actionButton} icon="pencil">
                Edit
              </Button>
              {!student.is_active ? (
                <Button
                  mode="contained"
                  onPress={onReactivate}
                  disabled={reactivating}
                  loading={reactivating}
                  buttonColor="#10B981"
                  style={styles.actionButton}
                  icon="check-circle"
                >
                  Reactivate
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={onDelete}
                  textColor="#EF4444"
                  style={styles.actionButton}
                  icon="delete"
                >
                  Delete
                </Button>
              )}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6366F1',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  searchInput: {
    fontSize: 14,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
  },
  branchFilter: {
    marginBottom: 12,
  },
  beltFilter: {
    marginBottom: 12,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyCard: {
    marginTop: 32,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  studentCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatar: {
    backgroundColor: '#F3E8FF',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  studentId: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  beltBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  beltText: {
    fontWeight: '600',
    fontSize: 11,
  },
  incompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  incompleteText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '600',
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  inactiveText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailText: {
    color: '#6B7280',
    flex: 1,
    fontSize: 13,
  },
  studentActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#7B2CBF',
  },
})

