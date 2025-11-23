import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Snackbar, Searchbar, Chip } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getBranches, deleteBranch, getBranchStatistics, type Branch, type BranchWithAdmin } from '@/lib/branches'
import { getProfileByUserId } from '@/lib/profiles'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'

interface BranchStats {
  total: number
  active: number
  inactive: number
  admins: number
  newThisMonth: number
}

export default function BranchesScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [stats, setStats] = useState<BranchStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    newThisMonth: 0,
  })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    checkRole()
    loadData()
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [branches, searchQuery, statusFilter])

  const checkRole = async () => {
    if (user?.id) {
      const result = await getProfileByUserId(user.id)
      if (result.profile && result.profile.role === 'super_admin') {
        setIsSuperAdmin(true)
      }
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [branchesResult, statsResult] = await Promise.all([
        getBranches({ page: 1, limit: 20, includeAdmin: true }),
        getBranchStatistics(),
      ])

      if (branchesResult.error) {
        setSnackbar({ visible: true, message: branchesResult.error.message })
      } else if (branchesResult.branches) {
        setBranches(branchesResult.branches)
        setHasMore(branchesResult.branches.length >= 20)
        setPage(1)
      }

      if (statsResult.error) {
        console.error('Error loading statistics:', statsResult.error)
      } else {
        setStats({
          total: statsResult.total,
          active: statsResult.active,
          inactive: statsResult.inactive,
          admins: statsResult.admins,
          newThisMonth: statsResult.newThisMonth,
        })
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load branches' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const result = await getBranches({ 
        page: nextPage, 
        limit: 20, 
        status: statusFilter === 'all' ? undefined : statusFilter,
        includeAdmin: true 
      })

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else if (result.branches) {
        setBranches(prev => [...prev, ...result.branches!])
        setHasMore(result.branches.length >= 20)
        setPage(nextPage)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load more branches' })
    } finally {
      setLoadingMore(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...branches]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        branch =>
          branch.name.toLowerCase().includes(query) ||
          branch.code?.toLowerCase().includes(query) ||
          branch.address?.toLowerCase().includes(query) ||
          branch.phone?.toLowerCase().includes(query) ||
          branch.email?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(branch => branch.status === statusFilter)
    }

    setFilteredBranches(filtered)
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [])

  const handleDelete = async (branchId: string, branchName: string) => {
    if (!user?.id) return

    try {
      const result = await deleteBranch(branchId, user.id)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        // Reload data to refresh the list
        loadData()
        
        // Check if branch still exists (soft deleted) or was removed (hard deleted)
        // We need to check after a small delay to allow the database to update
        setTimeout(async () => {
          const updatedResult = await getBranches({ page: 1, limit: 1000, includeAdmin: true })
          const deletedBranch = updatedResult.branches?.find(b => b.id === branchId)
          
          if (deletedBranch && deletedBranch.status === 'inactive') {
            // Branch was soft deleted - show informative message
            setSnackbar({ 
              visible: true, 
              message: `Branch "${branchName}" has students and was set to inactive. Students are still associated with this branch.` 
            })
          } else {
            setSnackbar({ visible: true, message: `Branch "${branchName}" deleted successfully` })
          }
        }, 500)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to delete branch' })
    }
  }

  if (loading && branches.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading branches...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header with Create Button */}
      {isSuperAdmin && (
        <View style={styles.header}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => router.push('/(admin)/(tabs)/create-branch')}
            style={styles.createButton}
            buttonColor="#7B2CBF"
          >
            Create Branch
          </Button>
        </View>
      )}

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
                <MaterialCommunityIcons name="office-building" size={24} color="#6366F1" />
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
                <MaterialCommunityIcons name="account-tie" size={24} color="#7B2CBF" />
                <Text variant="headlineSmall" style={[styles.statNumber, { color: '#7B2CBF' }]}>
                  {stats.admins}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Admins
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="calendar-plus" size={24} color="#F59E0B" />
                <Text variant="headlineSmall" style={[styles.statNumber, { color: '#F59E0B' }]}>
                  {stats.newThisMonth}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  New
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.filterSection}>
          <Searchbar
            placeholder="Search branches..."
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
        </View>

        {/* Branches List */}
        <View style={styles.content}>
          {filteredBranches.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="office-building-outline" size={64} color="#9CA3AF" />
                <Text variant="titleMedium" style={styles.emptyText}>
                  No branches found
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : isSuperAdmin
                    ? 'Create your first branch to get started'
                    : 'No branches available'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            filteredBranches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                isSuperAdmin={isSuperAdmin}
                onEdit={() => router.push(`/(admin)/(tabs)/edit-branch?id=${branch.id}`)}
                // Admin assignment disabled - Super Admin manages all branches directly
                onAssignAdmin={() => {}} // Disabled - no action
                onDelete={() => handleDelete(branch.id, branch.name)}
              />
            ))
          )}

          {/* Load More */}
          {hasMore && filteredBranches.length > 0 && (
            <View style={styles.loadMoreContainer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color="#7B2CBF" />
              ) : (
                <Button
                  mode="text"
                  onPress={loadMore}
                  textColor="#7B2CBF"
                >
                  Load More
                </Button>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  )
}

// Enhanced Branch Card Component
function BranchCard({
  branch,
  isSuperAdmin,
  onEdit,
  onAssignAdmin,
  onDelete,
}: {
  branch: Branch | BranchWithAdmin
  isSuperAdmin: boolean
  onEdit: () => void
  onAssignAdmin: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const branchWithAdmin = branch as BranchWithAdmin

  return (
    <Card style={styles.branchCard}>
      <Card.Content>
        {/* Header */}
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={styles.branchHeader}>
            <View style={styles.branchInfo}>
              <View style={styles.branchTitleRow}>
                <Text variant="titleMedium" style={styles.branchName}>
                  {branch.name}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    branch.status === 'active' ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.statusText,
                      branch.status === 'active' ? styles.activeText : styles.inactiveText,
                    ]}
                  >
                    {branch.status}
                  </Text>
                </View>
              </View>
              {branch.code && (
                <Text variant="bodySmall" style={styles.branchCode}>
                  Code: {branch.code}
                </Text>
              )}
            </View>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Address */}
            {branch.address && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#6B7280" />
                <Text variant="bodySmall" style={styles.detailText}>
                  {branch.address}
                </Text>
              </View>
            )}

            {/* Contact Info */}
            {(branch.phone || branch.email) && (
              <View style={styles.contactRow}>
                {branch.phone && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="phone" size={18} color="#6B7280" />
                    <Text variant="bodySmall" style={styles.detailText}>
                      {branch.phone}
                    </Text>
                  </View>
                )}
                {branch.email && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="email" size={18} color="#6B7280" />
                    <Text variant="bodySmall" style={styles.detailText}>
                      {branch.email}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Created Date */}
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
              <Text variant="bodySmall" style={styles.detailText}>
                Created: {format(new Date(branch.created_at), 'MMM dd, yyyy')}
              </Text>
            </View>

            {/* Admin Information */}
            {branchWithAdmin.admin && (
              <View style={styles.adminSection}>
                <View style={styles.adminHeader}>
                  <MaterialCommunityIcons name="account-tie" size={18} color="#7B2CBF" />
                  <Text variant="titleSmall" style={styles.adminTitle}>
                    Branch Admin
                  </Text>
                </View>
                <View style={styles.adminDetails}>
                  <Text variant="bodySmall" style={styles.adminName}>
                    {branchWithAdmin.admin.name}
                  </Text>
                  {branchWithAdmin.admin.email && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="email" size={16} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.detailText}>
                        {branchWithAdmin.admin.email}
                      </Text>
                    </View>
                  )}
                  {branchWithAdmin.admin.phone && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="phone" size={16} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.detailText}>
                        {branchWithAdmin.admin.phone}
                      </Text>
                    </View>
                  )}
                  {branchWithAdmin.admin.qualifications && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="certificate" size={16} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.detailText}>
                        {branchWithAdmin.admin.qualifications}
                      </Text>
                    </View>
                  )}
                  {branchWithAdmin.admin.experience && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.detailText}>
                        {branchWithAdmin.admin.experience}
                      </Text>
                    </View>
                  )}
                  {branchWithAdmin.admin.specialization && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="karate" size={16} color="#6B7280" />
                      <Text variant="bodySmall" style={styles.detailText}>
                        {branchWithAdmin.admin.specialization}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.branchActions}>
              <Button
                mode="outlined"
                onPress={onEdit}
                style={styles.actionButton}
                icon="pencil"
              >
                Edit
              </Button>
              {isSuperAdmin && (
                <>
                  {/* Assign Admin button disabled - Super Admin manages all branches directly */}
                  {/* Uncomment below to re-enable admin assignment */}
                  {/*
                  <Button
                    mode="outlined"
                    onPress={onAssignAdmin}
                    style={styles.actionButton}
                    icon="account-tie"
                  >
                    Admin
                  </Button>
                  */}
                  <Button
                    mode="outlined"
                    onPress={onDelete}
                    textColor="#7B2CBF"
                    style={styles.actionButton}
                    icon="delete"
                  >
                    Delete
                  </Button>
                </>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  createButton: {
    alignSelf: 'flex-start',
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
  },
  chip: {
    marginRight: 8,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
  branchCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  branchInfo: {
    flex: 1,
  },
  branchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  branchName: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  branchCode: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 11,
  },
  activeText: {
    color: '#065F46',
  },
  inactiveText: {
    color: '#D97706',
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
  contactRow: {
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    color: '#6B7280',
    flex: 1,
    fontSize: 13,
  },
  adminSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adminTitle: {
    fontWeight: '600',
    color: '#7B2CBF',
  },
  adminDetails: {
    gap: 8,
  },
  adminName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontSize: 14,
  },
  branchActions: {
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
})
