import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { StorageMonitoringSection } from '@/components/admin/dashboard/StorageMonitoringSection'
import { COLORS, RADIUS, SPACING } from '@/lib/design-system'

interface Feature {
  icon: string
  label: string
  route: string
  gradient: string[]
  iconColor: string
}

const FEATURES: Feature[] = [
  {
    icon: 'account-group',
    label: 'Students',
    route: '/(admin)/(tabs)/students',
    gradient: ['#7B2CBF', '#6D28D9'],
    iconColor: '#FFFFFF',
  },
  {
    icon: 'office-building',
    label: 'Branches',
    route: '/(admin)/(tabs)/branches',
    gradient: ['#6366F1', '#4F46E5'],
    iconColor: '#FFFFFF',
  },
  {
    icon: 'cash-multiple',
    label: 'Fees',
    route: '/(admin)/(tabs)/student-fees',
    gradient: ['#F59E0B', '#D97706'],
    iconColor: '#FFFFFF',
  },
  {
    icon: 'bell-outline',
    label: 'Notifications',
    route: '/(admin)/(tabs)/notifications',
    gradient: ['#EC4899', '#DB2777'],
    iconColor: '#FFFFFF',
  },
  {
    icon: 'image-multiple',
    label: 'Public Gallery',
    route: '/(admin)/(tabs)/public-gallery',
    gradient: ['#22C55E', '#16A34A'],
    iconColor: '#FFFFFF',
  },
  {
    icon: 'account-circle',
    label: 'Account & Settings',
    route: '/(admin)/(tabs)/account-settings',
    gradient: ['#64748B', '#475569'],
    iconColor: '#FFFFFF',
  },
]

export default function MoreScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <AdminHeader title="All Features" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text variant="titleLarge" style={styles.pageTitle}>
          Quick Access
        </Text>
        <Text variant="bodyMedium" style={styles.pageSubtitle}>
          Access all features and tools from here
        </Text>

        <View style={styles.featuresGrid}>
          <View style={styles.featureRow}>
            {FEATURES.slice(0, 3).map((feature) => (
              <TouchableOpacity
                key={feature.route}
                style={styles.featureButton}
                activeOpacity={0.8}
                onPress={() => router.push(feature.route as any)}
              >
                <Card style={styles.card}>
                  <LinearGradient
                    colors={feature.gradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                  >
                    <Card.Content style={styles.featureContent}>
                      <MaterialCommunityIcons
                        name={feature.icon as any}
                        size={32}
                        color={feature.iconColor}
                      />
                      <Text variant="bodyMedium" style={styles.featureLabel}>
                        {feature.label}
                      </Text>
                    </Card.Content>
                  </LinearGradient>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.featureRow}>
            {FEATURES.slice(3, 6).map((feature) => (
              <TouchableOpacity
                key={feature.route}
                style={styles.featureButton}
                activeOpacity={0.8}
                onPress={() => router.push(feature.route as any)}
              >
                <Card style={styles.card}>
                  <LinearGradient
                    colors={feature.gradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                  >
                    <Card.Content style={styles.featureContent}>
                      <MaterialCommunityIcons
                        name={feature.icon as any}
                        size={32}
                        color={feature.iconColor}
                      />
                      <Text variant="bodyMedium" style={styles.featureLabel}>
                        {feature.label}
                      </Text>
                    </Card.Content>
                  </LinearGradient>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Storage Usage Section */}
        <View style={styles.storageSection}>
          <StorageMonitoringSection />
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
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
  content: {
    padding: SPACING.lg,
    paddingBottom: 80,
  },
  pageTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontSize: 28,
  },
  pageSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    fontSize: 15,
  },
  featuresGrid: {
    gap: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  featureButton: {
    flex: 1,
  },
  card: {
    elevation: 4,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  gradient: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  featureContent: {
    alignItems: 'center',
    padding: 0,
    gap: SPACING.sm,
    minHeight: 100,
    justifyContent: 'center',
  },
  featureLabel: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  storageSection: {
    marginTop: SPACING.xl,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
})

