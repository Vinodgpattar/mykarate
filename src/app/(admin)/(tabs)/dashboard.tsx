import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getBranches, type Branch } from '@/lib/branches'
import { getProfileByUserId } from '@/lib/profiles'

export default function AdminDashboardScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkRole()
    loadData()
  }, [user])

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
      const result = await getBranches()
      if (result.branches) {
        setBranches(result.branches as Branch[])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['branches'] })
    await loadData()
  }

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear React Query cache
              queryClient.clear()
              // Sign out from Supabase
              await signOut()
              // Navigate to login
              router.replace('/(auth)/login')
            } catch (error) {
              console.error('Error signing out:', error)
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          },
        },
      ]
    )
  }

  const today = format(new Date(), 'EEEE, MMM dd, yyyy')
  const time = format(new Date(), 'h:mm a')
  const activeBranches = branches.filter((b) => b.status === 'active').length
  const totalBranches = branches.length

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="karate" size={24} color="#7B2CBF" />
            </View>
            <Text variant="headlineSmall" style={styles.brandName}>
              Karate Dojo
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(admin)/(tabs)/more')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-circle" size={28} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text variant="titleLarge" style={styles.welcomeText}>
            Welcome back!
          </Text>
          <Text variant="bodyMedium" style={styles.dateText}>
            {today} • {time}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📊 Overview
          </Text>
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="office-building" size={28} color="#6366F1" />
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {totalBranches}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Branches
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="check-circle" size={28} color="#10B981" />
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#10B981' }]}>
                  {activeBranches}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Active Branches
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            ⚡ Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              onPress={() => router.push('/(admin)/(tabs)/branches')}
              activeOpacity={0.8}
              style={styles.actionCard}
            >
              <Card style={styles.actionCardInner}>
                <Card.Content style={styles.actionContent}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <MaterialCommunityIcons name="office-building-outline" size={32} color="#7B2CBF" />
                  </View>
                  <Text variant="titleSmall" style={styles.actionLabel}>
                    Branches
                  </Text>
                  <Text variant="bodySmall" style={styles.actionSubtext}>
                    Manage branches
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Branches */}
        {branches.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📋 Recent Branches
            </Text>
            {branches.slice(0, 3).map((branch) => (
              <Card key={branch.id} style={styles.branchCard}>
                <Card.Content>
                  <View style={styles.branchRow}>
                    <View style={styles.branchInfo}>
                      <Text variant="titleSmall" style={styles.branchName}>
                        {branch.name}
                      </Text>
                      {branch.code && (
                        <Text variant="bodySmall" style={styles.branchCode}>
                          {branch.code}
                        </Text>
                      )}
                    </View>
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
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Bottom Padding for Tab Bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flex: 1,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  welcomeSection: {
    marginBottom: 24,
    paddingTop: 16,
  },
  welcomeText: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateText: {
    color: '#6B7280',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
  },
  actionCardInner: {
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  actionContent: {
    padding: 16,
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtext: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
  branchCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  branchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  branchCode: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  bottomPadding: {
    height: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#7B2CBF',
  },
})
