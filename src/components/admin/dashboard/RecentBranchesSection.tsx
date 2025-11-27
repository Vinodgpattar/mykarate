import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS, RADIUS, SPACING } from '@/lib/design-system'
import type { Branch } from '@/lib/branches'

interface RecentBranchesSectionProps {
  branches: Branch[]
}

export function RecentBranchesSection({ branches }: RecentBranchesSectionProps) {
  const router = useRouter()
  const recentBranches = branches.slice(0, 3)

  if (recentBranches.length === 0) {
    return null
  }

  const getBranchColor = (status: string) => {
    return status === 'active' ? '#10B981' : '#F59E0B'
  }

  const getBranchGradient = (status: string) => {
    return status === 'active'
      ? ['#D1FAE5', '#A7F3D0']
      : ['#FEF3C7', '#FDE68A']
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Branches
        </Text>
        {branches.length > 3 && (
          <TouchableOpacity onPress={() => router.push('/(admin)/(tabs)/branches')}>
            <Text variant="bodySmall" style={styles.viewAllText}>
              View All
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {recentBranches.map((branch) => (
        <TouchableOpacity
          key={branch.id}
          activeOpacity={0.8}
          onPress={() => router.push(`/(admin)/(tabs)/branches`)}
        >
          <Card style={styles.branchCard}>
            <Card.Content style={styles.branchContent}>
              <View style={[styles.iconCircle, { backgroundColor: getBranchColor(branch.status) + '20' }]}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={24}
                  color={getBranchColor(branch.status)}
                />
              </View>
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
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAllText: {
    color: COLORS.brandPurple,
    fontWeight: '600',
  },
  branchCard: {
    marginBottom: SPACING.md,
    elevation: 2,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  branchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  branchCode: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
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
})
