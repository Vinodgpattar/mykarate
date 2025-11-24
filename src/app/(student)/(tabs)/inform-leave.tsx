import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, FAB } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { getStudentLeaveInforms, type LeaveInform } from '@/lib/student-leave-informs'
import { logger } from '@/lib/logger'

export default function InformLeaveScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [informs, setInforms] = useState<LeaveInform[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    loadStudent()
  }, [user])

  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [studentId])

  const loadStudent = async () => {
    if (!user?.id) return

    try {
      const result = await getStudentByUserId(user.id)
      if (result.student) {
        setStudentId(result.student.id)
      }
    } catch (error) {
      logger.error('Error loading student', error as Error)
    }
  }

  const loadData = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const result = await getStudentLeaveInforms(studentId)

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
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <Chip
          icon="check-circle"
          style={[styles.statusChip, { backgroundColor: '#10B981' }]}
          textStyle={styles.statusChipText}
        >
          Approved
        </Chip>
      )
    }
    return (
      <Chip
        icon="clock-outline"
        style={[styles.statusChip, { backgroundColor: '#F59E0B' }]}
        textStyle={styles.statusChipText}
      >
        Pending
      </Chip>
    )
  }

  if (loading && !studentId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Inform Leave
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Inform Leave
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Let your teacher know when you can't attend class
        </Text>
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
        ) : informs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="information-outline" size={64} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Leave Informs Yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Tap the + button to inform your teacher about your absence
              </Text>
            </Card.Content>
          </Card>
        ) : (
          informs.map((inform) => (
            <Card key={inform.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  {getStatusBadge(inform.status)}
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {formatDistanceToNow(new Date(inform.created_at), { addSuffix: true })}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.message}>
                  {inform.message}
                </Text>
                {inform.approved_at && (
                  <View style={styles.approvedInfo}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                    <Text variant="bodySmall" style={styles.approvedText}>
                      Approved {formatDistanceToNow(new Date(inform.approved_at), { addSuffix: true })}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/(student)/create-leave-inform')}
        label="Inform"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timestamp: {
    color: '#9CA3AF',
  },
  message: {
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
  },
  approvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  approvedText: {
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#7B2CBF',
  },
})

