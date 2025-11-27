import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

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
    icon: 'clipboard-check',
    label: 'Mark Attendance',
    sublabel: "Today's class",
    route: '/(admin)/(tabs)/mark-attendance',
    gradient: ['#6366f1', '#4f46e5'],
    iconColor: '#fff',
  },
  {
    icon: 'account-plus',
    label: 'Add Student',
    sublabel: 'New enrollment',
    route: '/(admin)/(tabs)/create-student',
    gradient: ['#7B2CBF', '#6D28D9'],
    iconColor: '#fff',
  },
  {
    icon: 'cash-multiple',
    label: 'Record Payment',
    sublabel: 'Collect fees',
    route: '/(admin)/(tabs)/student-fees',
    gradient: ['#f59e0b', '#d97706'],
    iconColor: '#fff',
  },
  {
    icon: 'bullhorn-outline',
    label: 'Send Notice',
    sublabel: 'Announcement',
    route: '/(admin)/(tabs)/create-notification',
    gradient: ['#ec4899', '#db2777'],
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
                colors={action.gradient}
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
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
    elevation: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    borderRadius: 16,
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
