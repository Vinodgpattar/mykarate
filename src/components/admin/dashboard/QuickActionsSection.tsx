import { useState, useCallback, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { getPendingInformsCount } from '@/lib/student-leave-informs'

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
    icon: 'calendar-alert',
    label: 'Student Informs',
    sublabel: 'Leave requests',
    route: '/(admin)/(tabs)/student-informs',
    gradient: ['#10B981', '#059669'],
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
  const [pendingCount, setPendingCount] = useState(0)
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  const loadPendingCount = useCallback(async () => {
    // Prevent too frequent refreshes
    const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
    if (isLoadingRef.current || timeSinceLastLoad < 500) {
      return
    }

    isLoadingRef.current = true
    try {
      const result = await getPendingInformsCount()
      if (!result.error) {
        setPendingCount(result.count)
        lastLoadTimeRef.current = Date.now()
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [])

  // Refresh count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPendingCount()
    }, [loadPendingCount])
  )

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Quick Actions
      </Text>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action, index) => {
          const showBadge = action.route.includes('student-informs') && pendingCount > 0
          return (
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
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons
                        name={action.icon as any}
                        size={32}
                        color={action.iconColor}
                      />
                      {showBadge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </Text>
                        </View>
                      )}
                    </View>
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
          )
        })}
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
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
