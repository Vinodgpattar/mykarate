import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format, formatDistanceToNow } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getLeaveInformById, approveLeaveInform, deleteLeaveInform } from '@/lib/student-leave-informs'
import { logger } from '@/lib/logger'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function LeaveInformDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const informId = params.id as string

  const [inform, setInform] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (informId) {
      loadData()
    }
  }, [informId])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getLeaveInformById(informId)

      if (result.error) {
        logger.error('Error loading leave inform', result.error)
        router.back()
        return
      }

      setInform(result.inform)
    } catch (error) {
      logger.error('Unexpected error loading leave inform', error as Error)
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found')
      return
    }

    try {
      setApproving(true)
      const result = await approveLeaveInform(informId, user.id)

      if (result.error) {
        Alert.alert('Error', result.error.message)
        return
      }

      // Reload data to show updated status
      await loadData()
    } catch (error) {
      logger.error('Unexpected error approving leave inform', error as Error)
      Alert.alert('Error', 'Failed to approve leave inform')
    } finally {
      setApproving(false)
    }
  }

  const handleDelete = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found')
      return
    }

    if (!inform) return

    const studentName = getStudentName()

    Alert.alert(
      'Delete Leave Inform',
      `Are you sure you want to delete the leave inform from ${studentName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              const result = await deleteLeaveInform(informId, user.id)
              if (result.success) {
                logger.info('Leave inform deleted successfully', { informId })
                router.back()
              } else {
                Alert.alert('Error', result.error?.message || 'Failed to delete leave inform')
              }
            } catch (error) {
              logger.error('Unexpected error deleting leave inform', error as Error)
              Alert.alert('Error', 'Failed to delete leave inform')
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  const getStudentName = () => {
    if (inform?.student) {
      return `${inform.student.first_name} ${inform.student.last_name}`
    }
    return 'Unknown Student'
  }

  const getStudentPhoto = () => {
    return inform?.student?.student_photo_url || null
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading leave inform...</Text>
      </View>
    )
  }

  if (!inform) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={() => router.back()} mode="text" textColor="#666">
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            Leave Inform
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="bodyMedium" style={styles.errorText}>
            Leave inform not found
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <AdminHeader title="Leave Inform" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Student Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.studentInfo}>
              {getStudentPhoto() ? (
                <Image source={{ uri: getStudentPhoto()! }} style={styles.studentPhoto} />
              ) : (
                <View style={[styles.studentPhoto, styles.placeholderPhoto]}>
                  <MaterialCommunityIcons name="account" size={32} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.studentDetails}>
                <Text variant="titleLarge" style={styles.studentName}>
                  {getStudentName()}
                </Text>
                {inform.student?.student_id && (
                  <Text variant="bodyMedium" style={styles.studentId}>
                    {inform.student.student_id}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Leave Inform Details */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Text variant="labelLarge" style={styles.label}>
                Status
              </Text>
              {inform.status === 'approved' ? (
                <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                  <MaterialCommunityIcons name="check-circle" size={12} color="#FFFFFF" style={styles.statusIcon} />
                  <Text variant="labelSmall" style={styles.statusText}>
                    Approved
                  </Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="#FFFFFF" style={styles.statusIcon} />
                  <Text variant="labelSmall" style={styles.statusText}>
                    Pending
                  </Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="labelLarge" style={styles.label}>
                Message
              </Text>
              <Text variant="bodyLarge" style={styles.message}>
                {inform.message}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="labelLarge" style={styles.label}>
                Sent
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {format(new Date(inform.created_at), 'PPpp')}
              </Text>
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatDistanceToNow(new Date(inform.created_at), { addSuffix: true })}
              </Text>
            </View>

            {inform.approved_at && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text variant="labelLarge" style={styles.label}>
                    Approved
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {format(new Date(inform.approved_at), 'PPpp')}
                  </Text>
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {formatDistanceToNow(new Date(inform.approved_at), { addSuffix: true })}
                  </Text>
                </View>
                {inform.approver?.email && (
                  <Text variant="bodySmall" style={styles.approverText}>
                    Approved by: {inform.approver.email}
                  </Text>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {inform.status === 'pending' && (
            <Button
              mode="contained"
              onPress={handleApprove}
              loading={approving}
              disabled={approving}
              style={styles.approveButton}
              buttonColor="#10B981"
              icon="check-circle"
            >
              Approve Leave Inform
            </Button>
          )}

          {inform.status === 'approved' && (
            <Card style={[styles.card, styles.successCard]}>
              <Card.Content style={styles.successContent}>
                <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
                <Text variant="titleMedium" style={styles.successText}>
                  Leave Inform Approved
                </Text>
                <Text variant="bodyMedium" style={styles.successSubtext}>
                  Thank you for keeping us informed
                </Text>
              </Card.Content>
            </Card>
          )}

          <Button
            mode="outlined"
            onPress={handleDelete}
            loading={deleting}
            disabled={deleting}
            style={styles.deleteButton}
            textColor="#EF4444"
            icon="delete-outline"
          >
            Delete Leave Inform
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF8E7',
  },
  title: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 1,
    backgroundColor: '#FFFFFF',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
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
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  studentId: {
    color: '#6B7280',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: '#6B7280',
    fontWeight: '600',
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
  divider: {
    marginVertical: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  message: {
    color: '#1A1A1A',
    lineHeight: 24,
    marginTop: 8,
  },
  value: {
    color: '#1A1A1A',
    marginTop: 4,
  },
  timestamp: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  approverText: {
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  approveButton: {
    paddingVertical: 6,
  },
  deleteButton: {
    borderRadius: 8,
    borderColor: '#EF4444',
    paddingVertical: 6,
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successText: {
    marginTop: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  successSubtext: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
})

