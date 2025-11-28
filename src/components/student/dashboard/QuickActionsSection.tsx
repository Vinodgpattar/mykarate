import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'

interface QuickAction {
  icon: string
  label: string
  sublabel: string
  route: string
  gradient: string[]
  iconColor: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: 'calendar-check',
    label: 'My Attendance',
    sublabel: 'View records',
    route: '/(student)/(tabs)/my-attendance',
    gradient: ['#6366f1', '#4f46e5'],
    iconColor: '#fff',
  },
  {
    icon: 'cash-multiple',
    label: 'My Fees',
    sublabel: 'Payment status',
    route: '/(student)/(tabs)/my-fees',
    gradient: ['#7B2CBF', '#6D28D9'],
    iconColor: '#fff',
  },
  {
    icon: 'account',
    label: 'My Profile',
    sublabel: 'View & edit',
    route: '/(student)/(tabs)/profile',
    gradient: ['#f59e0b', '#d97706'],
    iconColor: '#fff',
  },
  {
    icon: 'bell-outline',
    label: 'Notifications',
    sublabel: 'Updates',
    route: '/(student)/(tabs)/notifications',
    gradient: ['#ec4899', '#db2777'],
    iconColor: '#fff',
  },
  {
    icon: 'file-document-outline',
    label: 'Leave Inform',
    sublabel: 'Request leave',
    route: '/(student)/(tabs)/inform-leave',
    gradient: ['#10b981', '#059669'],
    iconColor: '#fff',
  },
]

export function QuickActionsSection() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Quick Actions
      </Text>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.8}
            style={styles.actionTouchable}
          >
            <Card style={styles.card}>
              <LinearGradient
                colors={action.gradient as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
              >
                <Card.Content style={styles.content}>
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={32}
                    color={action.iconColor}
                  />
                  <Text variant="titleSmall" style={styles.label}>
                    {action.label}
                  </Text>
                  <Text variant="bodySmall" style={styles.sublabel}>
                    {action.sublabel}
                  </Text>
                </Card.Content>
              </LinearGradient>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTouchable: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
  },
  card: {
    elevation: ELEVATION.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    borderRadius: RADIUS.lg,
  },
  content: {
    alignItems: 'center',
    padding: 0,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  sublabel: {
    color: '#fff',
    opacity: 0.9,
    fontSize: 11,
    textAlign: 'center',
  },
})

