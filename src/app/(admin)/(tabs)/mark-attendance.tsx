import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native'
import { Text, Button, Card, Snackbar, ActivityIndicator, Chip, Menu, Divider, Searchbar } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getProfileByUserId } from '@/lib/profiles'
import { getBranches, type Branch } from '@/lib/branches'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  getStudentsForAttendance,
  getClassAttendance,
  markBulkAttendance,
  type AttendanceStatus,
  type AttendanceRecord,
} from '@/lib/attendance'
import { DatePicker } from '@/components/shared/DatePicker'
import { logger } from '@/lib/logger'

interface StudentAttendance {
  id: string
  first_name: string
  last_name: string
  student_id: string
  student_photo_url: string | null
  status?: AttendanceStatus
}

export default function MarkAttendanceScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceStatus>>(new Map())
  const [existingAttendanceMap, setExistingAttendanceMap] = useState<Map<string, AttendanceRecord>>(new Map())
  const [filteredStudents, setFilteredStudents] = useState<StudentAttendance[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'leave'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [branchMenuVisible, setBranchMenuVisible] = useState(false)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    checkRole()
    loadBranches()
  }, [user])

  useEffect(() => {
    if (selectedDate) {
      loadData()
    }
  }, [selectedDate, selectedBranchId, userBranchId])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!selectedDate) return
      
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
    }, [selectedDate, selectedBranchId, userBranchId])
  )

  useEffect(() => {
    applyFilters()
  }, [searchQuery, statusFilter, students, attendanceMap])

  const checkRole = async () => {
    if (user?.id) {
      const result = await getProfileByUserId(user.id)
      if (result.profile) {
        if (result.profile.role === 'super_admin') {
          setIsSuperAdmin(true)
        } else if (result.profile.role === 'admin' && result.profile.branchId) {
          setUserBranchId(result.profile.branchId)
          setSelectedBranchId(result.profile.branchId)
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

      const studentsResult = await getStudentsForAttendance(selectedBranchId || userBranchId || undefined)
      if (studentsResult.error) {
        setSnackbar({ visible: true, message: studentsResult.error.message })
        return
      }

      const studentsList = (studentsResult.students || []).map((s) => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        student_id: s.student_id,
        student_photo_url: s.student_photo_url,
      }))

      setStudents(studentsList)

      const attendanceResult = await getClassAttendance(selectedDate, selectedBranchId || userBranchId || undefined)
      if (!attendanceResult.error && attendanceResult.records) {
        const map = new Map<string, AttendanceStatus>()
        const existingMap = new Map<string, AttendanceRecord>()
        attendanceResult.records.forEach((record) => {
          map.set(record.student_id, record.status)
          existingMap.set(record.student_id, record)
        })
        setAttendanceMap(map)
        setExistingAttendanceMap(existingMap)
      } else {
        setAttendanceMap(new Map())
        setExistingAttendanceMap(new Map())
      }
      
    } catch (error) {
      logger.error('Unexpected error loading attendance data', error as Error)
      setSnackbar({ visible: true, message: 'Failed to load data' })
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

  const applyFilters = () => {
    let filtered = [...students]

    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase()
      filtered = filtered.filter((student) => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
        const studentId = student.student_id.toLowerCase()
        return fullName.includes(searchTerm) || studentId.includes(searchTerm)
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) => {
        const status = attendanceMap.get(student.id) || 'absent'
        return status === statusFilter
      })
    }

    setFilteredStudents(filtered)
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const newMap = new Map(attendanceMap)
    newMap.set(studentId, status)
    setAttendanceMap(newMap)
  }

  const handleMarkAllPresent = () => {
    const newMap = new Map(attendanceMap)
    students.forEach((student) => {
      newMap.set(student.id, 'present')
    })
    setAttendanceMap(newMap)
  }

  const handleMarkAllAbsent = () => {
    const newMap = new Map(attendanceMap)
    students.forEach((student) => {
      newMap.set(student.id, 'absent')
    })
    setAttendanceMap(newMap)
  }

  const handleSave = async () => {
    if (!user?.id) {
      setSnackbar({ visible: true, message: 'User not found' })
      return
    }

    try {
      setSaving(true)

      const records = students.map((student) => ({
        studentId: student.id,
        status: attendanceMap.get(student.id) || 'absent',
      }))

      if (records.length === 0) {
        setSnackbar({ visible: true, message: 'No students to mark attendance for' })
        return
      }

      const result = await markBulkAttendance(records, selectedDate, user.id)

      if (result.error) {
        const errorMessage = result.error.message.includes('invalid student')
          ? result.error.message
          : result.error.message.includes('Invalid date')
          ? result.error.message
          : result.error.message.includes('Invalid admin')
          ? 'You do not have permission to mark attendance'
          : `Failed to save attendance: ${result.error.message}`
        
        setSnackbar({ visible: true, message: errorMessage })
        return
      }

      setSnackbar({ visible: true, message: 'Attendance marked successfully!' })
      await loadData()
    } catch (error) {
      logger.error('Unexpected error saving attendance', error as Error)
      setSnackbar({ visible: true, message: 'Failed to save attendance' })
    } finally {
      setSaving(false)
    }
  }

  const getSelectedBranchName = () => {
    if (selectedBranchId) {
      const branch = branches.find((b) => b.id === selectedBranchId)
      return branch?.name || 'Select Branch'
    }
    return 'All Branches'
  }


  // Calculate stats
  const totalStudents = filteredStudents.length
  const presentCount = filteredStudents.filter(s => {
    const status = attendanceMap.get(s.id) || 'absent'
    return status === 'present'
  }).length
  const absentCount = filteredStudents.filter(s => {
    const status = attendanceMap.get(s.id) || 'absent'
    return status === 'absent'
  }).length
  const leaveCount = filteredStudents.filter(s => {
    const status = attendanceMap.get(s.id) || 'absent'
    return status === 'leave'
  }).length

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      {/* Professional Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineSmall" style={styles.title}>
              Attendance
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {totalStudents} students • {presentCount} present • {absentCount} absent • {leaveCount} leave
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7B2CBF" />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Selection Card */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <View style={styles.dateHeader}>
              <MaterialCommunityIcons name="calendar" size={20} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.dateTitle}>
                Select Date
              </Text>
            </View>
            <View style={styles.datePickerContainer}>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label="Class Date"
                maximumDate={(() => {
                  const maxDate = new Date()
                  maxDate.setDate(maxDate.getDate() + 7)
                  return maxDate
                })()}
                minimumDate={(() => {
                  const minDate = new Date()
                  minDate.setFullYear(minDate.getFullYear() - 1)
                  return minDate
                })()}
              />
            </View>
            <Text variant="bodySmall" style={styles.dateDisplayText}>
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </Card.Content>
        </Card>

        {/* Branch Filter Card (Super Admin only) */}
        {isSuperAdmin && branches.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <View style={styles.branchFilterContainer}>
                <MaterialCommunityIcons name="office-building" size={20} color="#7B2CBF" />
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
                      style={styles.branchButton}
                      contentStyle={styles.branchButtonContent}
                      buttonColor="#FFFFFF"
                      textColor="#7B2CBF"
                    >
                      {getSelectedBranchName()}
                    </Button>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setSelectedBranchId(null)
                      setBranchMenuVisible(false)
                    }}
                    title="All Branches"
                  />
                  {branches.map((branch) => (
                    <Menu.Item
                      key={branch.id}
                      onPress={() => {
                        setSelectedBranchId(branch.id)
                        setBranchMenuVisible(false)
                      }}
                      title={branch.name}
                    />
                  ))}
                </Menu>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Quick Filters Card */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <View style={styles.filtersContainer}>
              <Searchbar
                placeholder="Search students..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
              />
              <View style={styles.chipsRow}>
                <Chip
                  selected={statusFilter === 'all'}
                  onPress={() => setStatusFilter('all')}
                  style={styles.chip}
                  textStyle={statusFilter === 'all' ? styles.chipTextSelected : styles.chipText}
                  icon={statusFilter === 'all' ? 'check-circle' : 'circle-outline'}
                >
                  All
                </Chip>
                <Chip
                  selected={statusFilter === 'present'}
                  onPress={() => setStatusFilter('present')}
                  style={[styles.chip, statusFilter === 'present' && { backgroundColor: '#D1FAE5' }]}
                  textStyle={statusFilter === 'present' ? styles.chipTextSelected : styles.chipText}
                  icon={statusFilter === 'present' ? 'check-circle' : 'circle-outline'}
                >
                  Present
                </Chip>
                <Chip
                  selected={statusFilter === 'absent'}
                  onPress={() => setStatusFilter('absent')}
                  style={[styles.chip, statusFilter === 'absent' && { backgroundColor: '#FEE2E2' }]}
                  textStyle={statusFilter === 'absent' ? styles.chipTextSelected : styles.chipText}
                  icon={statusFilter === 'absent' ? 'close-circle' : 'circle-outline'}
                >
                  Absent
                </Chip>
                <Chip
                  selected={statusFilter === 'leave'}
                  onPress={() => setStatusFilter('leave')}
                  style={[styles.chip, statusFilter === 'leave' && { backgroundColor: '#FEF3C7' }]}
                  textStyle={statusFilter === 'leave' ? styles.chipTextSelected : styles.chipText}
                  icon={statusFilter === 'leave' ? 'calendar-clock' : 'circle-outline'}
                >
                  Leave
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7B2CBF" />
                <Text variant="bodyMedium" style={styles.loadingText}>
                  Loading attendance...
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Students List */}
        {!loading && (
          <View style={styles.list}>
            {filteredStudents.length === 0 ? (
              <Card style={styles.sectionCard} mode="elevated" elevation={1}>
                <Card.Content>
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="account-off" size={64} color="#9CA3AF" />
                    <Text variant="titleMedium" style={styles.emptyTitle}>
                      No students found
                    </Text>
                    <Text variant="bodySmall" style={styles.emptyText}>
                      {searchQuery
                        ? 'Try adjusting your search or filters'
                        : students.length === 0
                        ? (selectedBranchId ? 'No active students in this branch' : 'No active students found')
                        : 'No students match the current filters'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ) : (
              filteredStudents.map((student) => {
                const status = attendanceMap.get(student.id) || 'absent'
                const existing = existingAttendanceMap.get(student.id)
                const hasStatus = status !== 'absent' || existing !== null
                
                return (
                  <EnhancedStudentCard
                    key={student.id}
                    student={student}
                    status={status}
                    existing={existing}
                    hasStatus={hasStatus}
                    onStatusChange={(newStatus) => handleStatusChange(student.id, newStatus)}
                  />
                )
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {!loading && filteredStudents.length > 0 && (
        <Card style={[styles.actionBar, { paddingBottom: insets.bottom + 8 }]} mode="elevated" elevation={4}>
          <Card.Content style={styles.actionBarContent}>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="check-all"
                onPress={handleMarkAllPresent}
                disabled={saving}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                buttonColor="#10B981"
                textColor="#FFFFFF"
                compact
              >
                Mark All Present
              </Button>
              <Button
                mode="outlined"
                icon="close-circle"
                onPress={handleMarkAllAbsent}
                disabled={saving}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                textColor="#EF4444"
                compact
              >
                Mark All Absent
              </Button>
              <Button
                mode="contained"
                icon="content-save"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                buttonColor="#7B2CBF"
                textColor="#FFFFFF"
                compact
              >
                Save
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ visible: false, message: '' }),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

// Enhanced Student Card Component - Clean and Compact
function EnhancedStudentCard({
  student,
  status,
  existing,
  hasStatus,
  onStatusChange,
}: {
  student: StudentAttendance
  status: AttendanceStatus
  existing: AttendanceRecord | null | undefined
  hasStatus: boolean
  onStatusChange: (status: AttendanceStatus) => void
}) {
  const getStatusConfig = (s: AttendanceStatus) => {
    switch (s) {
      case 'present':
        return { text: 'Present', color: '#FFFFFF', bg: '#10B981' }
      case 'absent':
        return { text: 'Absent', color: '#FFFFFF', bg: '#EF4444' }
      case 'leave':
        return { text: 'Leave', color: '#FFFFFF', bg: '#F59E0B' }
      default:
        return { text: 'Not Marked', color: '#FFFFFF', bg: '#6B7280' }
    }
  }

  const statusConfig = getStatusConfig(status)

  const statusToggleConfig = {
    present: { label: 'P', color: '#10B981', bg: '#D1FAE5' },
    absent: { label: 'A', color: '#EF4444', bg: '#FEE2E2' },
    leave: { label: 'L', color: '#F59E0B', bg: '#FEF3C7' },
  }

  return (
    <Card
      style={[
        styles.studentCard,
        hasStatus && styles.hasAttendanceCard,
      ]}
      elevation={0}
    >
      <Card.Content style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
              {student.first_name} {student.last_name}
            </Text>
            <Text variant="bodySmall" style={styles.studentId}>
              {student.student_id}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text variant="labelSmall" style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Status Toggles - Inline */}
        <View style={styles.statusToggles}>
          {(['present', 'absent', 'leave'] as AttendanceStatus[]).map((s) => {
            const config = statusToggleConfig[s]
            const isActive = status === s

            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusToggle,
                  isActive
                    ? [styles.statusToggleActive, { backgroundColor: config.color }]
                    : [styles.statusToggleInactive, { borderColor: config.color, backgroundColor: config.bg }],
                ]}
                onPress={() => onStatusChange(s)}
                activeOpacity={0.7}
              >
                {isActive && (
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color="#FFFFFF"
                    style={styles.toggleIcon}
                  />
                )}
                <Text
                  style={[
                    styles.toggleLabel,
                    isActive ? styles.toggleLabelActive : { color: config.color, fontWeight: '700' },
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Existing Attendance Info */}
        {existing && existing.status !== status && (
          <View style={styles.infoBadge}>
            <MaterialCommunityIcons name="information" size={14} color="#6B7280" />
            <Text variant="bodySmall" style={styles.infoText}>
              Previously: {statusConfig.text.toLowerCase()} • Will update
            </Text>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666666',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  dateDisplayText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  branchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  branchButton: {
    flex: 1,
    borderColor: '#7B2CBF',
  },
  branchButtonContent: {
    paddingVertical: 4,
  },
  filtersContainer: {
    gap: 12,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    height: 32,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextSelected: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666666',
  },
  list: {
    gap: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#666666',
    fontWeight: '600',
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
  },
  studentCard: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 0,
  },
  hasAttendanceCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  cardContent: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '500',
    color: '#111827',
    fontSize: 14,
    marginBottom: 2,
  },
  studentId: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusToggles: {
    flexDirection: 'row',
    gap: 6,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 44,
    flex: 1,
  },
  statusToggleActive: {
    borderColor: 'transparent',
  },
  statusToggleInactive: {
    borderWidth: 2,
  },
  toggleIcon: {
    marginRight: -1,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: '#FFFFFF',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  infoText: {
    color: '#6B7280',
    flex: 1,
    fontSize: 11,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionBarContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
})
