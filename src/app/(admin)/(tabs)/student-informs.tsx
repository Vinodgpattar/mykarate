import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, Searchbar, Menu, Divider } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAllLeaveInforms, type LeaveInform } from '@/lib/student-leave-informs'
import { logger } from '@/lib/logger'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function StudentInformsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [informs, setInforms] = useState<LeaveInform[]>([])
  const [filteredInforms, setFilteredInforms] = useState<LeaveInform[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [statusMenuVisible, setStatusMenuVisible] = useState(false)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [informs, searchQuery, statusFilter])

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
    }, [statusFilter, searchQuery])
  )

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getAllLeaveInforms({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      })

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

  const applyFilters = () => {
    let filtered = [...informs]

    // Status filter is already applied in loadData, but we can filter client-side too
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inform) => inform.status === statusFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((inform) => {
        const studentName = inform.student
          ? `${inform.student.first_name} ${inform.student.last_name}`.toLowerCase()
          : ''
        const message = inform.message.toLowerCase()
        return studentName.includes(query) || message.includes(query)
      })
    }

    setFilteredInforms(filtered)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
          <MaterialCommunityIcons name="check-circle" size={12} color="#FFFFFF" style={styles.statusIcon} />
          <Text variant="labelSmall" style={styles.statusText}>
            Approved
          </Text>
        </View>
      )
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
        <MaterialCommunityIcons name="clock-outline" size={12} color="#FFFFFF" style={styles.statusIcon} />
        <Text variant="labelSmall" style={styles.statusText}>
          Pending
        </Text>
      </View>
    )
  }

  const getStudentName = (inform: LeaveInform) => {
    if (inform.student) {
      return `${inform.student.first_name} ${inform.student.last_name}`
    }
    return 'Unknown Student'
  }

  const getStudentPhoto = (inform: LeaveInform) => {
    return inform.student?.student_photo_url || null
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Student Informs"
        subtitle="Students have informed about their absence"
      />

      <View style={styles.filters}>
        <Searchbar
          placeholder="Search by student name or message..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
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
              {statusFilter === 'all' ? 'All' : statusFilter === 'pending' ? 'Pending' : 'Approved'}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setStatusFilter('all'); setStatusMenuVisible(false); loadData() }} title="All" />
          <Menu.Item onPress={() => { setStatusFilter('pending'); setStatusMenuVisible(false); loadData() }} title="Pending" />
          <Menu.Item onPress={() => { setStatusFilter('approved'); setStatusMenuVisible(false); loadData() }} title="Approved" />
        </Menu>
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
        ) : filteredInforms.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="information-outline" size={64} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Leave Informs
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No informs match your filters'
                  : 'No students have informed about leave yet'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredInforms.map((inform) => (
            <TouchableOpacity
              key={inform.id}
              onPress={() => router.push(`/(admin)/(tabs)/leave-inform-detail?id=${inform.id}`)}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.studentInfo}>
                      {getStudentPhoto(inform) ? (
                        <Image
                          source={{ uri: getStudentPhoto(inform)! }}
                          style={styles.studentPhoto}
                        />
                      ) : (
                        <View style={[styles.studentPhoto, styles.placeholderPhoto]}>
                          <MaterialCommunityIcons name="account" size={24} color="#9CA3AF" />
                        </View>
                      )}
                      <View style={styles.studentDetails}>
                        <Text variant="titleMedium" style={styles.studentName}>
                          {getStudentName(inform)}
                        </Text>
                        {inform.student?.student_id && (
                          <Text variant="bodySmall" style={styles.studentId}>
                            {inform.student.student_id}
                          </Text>
                        )}
                      </View>
                    </View>
                    {getStatusBadge(inform.status)}
                  </View>
                  <Text variant="bodyMedium" style={styles.message} numberOfLines={2}>
                    {inform.message}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text variant="bodySmall" style={styles.timestamp}>
                      {formatDistanceToNow(new Date(inform.created_at), { addSuffix: true })}
                    </Text>
                    {inform.status === 'pending' && (
                      <Chip
                        icon="alert-circle"
                        style={styles.newChip}
                        textStyle={styles.newChipText}
                      >
                        New
                      </Chip>
                    )}
                  </View>
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
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  placeholderPhoto: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    marginRight: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  message: {
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  timestamp: {
    color: '#9CA3AF',
  },
  newChip: {
    height: 24,
    backgroundColor: '#3B82F6',
  },
  newChipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
})

