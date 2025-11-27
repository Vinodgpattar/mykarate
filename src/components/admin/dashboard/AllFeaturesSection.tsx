import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
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

export function AllFeaturesSection() {
  const router = useRouter()

  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        All Features
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
                  colors={feature.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradient}
                >
                  <Card.Content style={styles.featureContent}>
                    <MaterialCommunityIcons
                      name={feature.icon as any}
                      size={28}
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
                  colors={feature.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradient}
                >
                  <Card.Content style={styles.featureContent}>
                    <MaterialCommunityIcons
                      name={feature.icon as any}
                      size={28}
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
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  featuresGrid: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureButton: {
    flex: 1,
  },
  card: {
    elevation: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
  },
  featureContent: {
    alignItems: 'center',
    padding: 0,
    gap: 8,
    minHeight: 90,
    justifyContent: 'center',
  },
  featureLabel: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
  },
})
