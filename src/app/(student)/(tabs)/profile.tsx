import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Snackbar, ProgressBar } from 'react-native-paper'
import { useRouter, useFocusEffect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId, updateStudent, type UpdateStudentData } from '@/lib/students'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { StudentHeader } from '@/components/student/StudentHeader'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'
import { logger } from '@/lib/logger'

export default function StudentProfileScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    if (user?.id) {
      loadStudent()
    }
  }, [user])

  // Reload student data when screen comes into focus (e.g., after uploading image)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadStudent()
      }
    }, [user])
  )

  const loadStudent = async () => {
    try {
      setLoading(true)
      const result = await getStudentByUserId(user!.id)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else if (result.student) {
        setStudent(result.student)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletion = () => {
    if (!student) return 0
    const fields = [
      student.date_of_birth,
      student.gender,
      student.address,
      student.aadhar_number,
      student.student_photo_url,
      student.aadhar_card_url,
      student.parent_name,
      student.emergency_contact_name,
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
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
              logger.error('Error signing out', error instanceof Error ? error : new Error(String(error)))
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#F59E0B" />
        <Text style={styles.loadingText}>Profile not found</Text>
      </View>
    )
  }

  const completion = calculateCompletion()

  return (
    <View style={styles.container}>
      <StudentHeader title="My Profile" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Profile Completion Card */}
        {!student.profile_completed && (
          <Card style={styles.completionCard}>
            <Card.Content>
              <View style={styles.completionHeader}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#F59E0B" />
                <Text variant="titleMedium" style={styles.completionTitle}>
                  Complete Your Profile
                </Text>
              </View>
              <ProgressBar progress={completion / 100} color={COLORS.brandPurple} style={styles.progressBar} />
              <Text variant="bodySmall" style={styles.completionText}>
                {completion}% Complete
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/(student)/(tabs)/complete-profile')}
                style={styles.completeButton}
                buttonColor={COLORS.brandPurple}
              >
                Complete Profile
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Profile Info */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              {student.student_photo_url ? (
                <Image source={{ uri: student.student_photo_url }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={40} color={COLORS.brandPurple} />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.profileName}>
                  {student.first_name} {student.last_name}
                </Text>
                <Text variant="bodyMedium" style={styles.studentId}>
                  {student.student_id}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={24} color={COLORS.brandPurple} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Personal Information
              </Text>
            </View>
            <InfoRow icon="email" label="Email" value={student.email} />
            {student.phone && <InfoRow icon="phone" label="Phone" value={student.phone} />}
            {student.date_of_birth && (
              <InfoRow
                icon="calendar"
                label="Date of Birth"
                value={format(new Date(student.date_of_birth), 'MMM dd, yyyy')}
              />
            )}
            {student.gender && <InfoRow icon="gender-male-female" label="Gender" value={student.gender} />}
            {student.address && <InfoRow icon="map-marker" label="Address" value={student.address} />}
            {student.current_belt && (
              <InfoRow icon="karate" label="Current Belt" value={student.current_belt} />
            )}
          </Card.Content>
        </Card>

        {/* Branch Information */}
        {student.branch && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="office-building" size={24} color="#6366F1" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Branch
                </Text>
              </View>
              <InfoRow icon="office-building" label="Branch" value={student.branch.name} />
              {student.branch.code && (
                <InfoRow icon="tag" label="Branch Code" value={student.branch.code} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Edit Button */}
        <Button
          mode="outlined"
          onPress={() => router.push('/(student)/(tabs)/complete-profile')}
          style={styles.editButton}
          icon="pencil"
        >
          {student.profile_completed ? 'Edit Profile' : 'Complete Profile'}
        </Button>

        {/* Logout Button */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={COLORS.warning}
          icon="logout"
        >
          Sign Out
        </Button>

        <View style={styles.bottomPadding} />
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

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color={COLORS.textSecondary} />
      <View style={styles.infoContent}>
        <Text variant="bodySmall" style={styles.infoLabel}>
          {label}
        </Text>
        <Text variant="bodyMedium" style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
  },
  completionCard: {
    marginBottom: SPACING.lg,
    elevation: ELEVATION.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  completionTitle: {
    fontWeight: '600',
    color: '#D97706',
  },
  progressBar: {
    height: 8,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  completionText: {
    color: '#92400E',
    marginBottom: SPACING.md,
    fontSize: 13,
  },
  completeButton: {
    marginTop: SPACING.sm,
  },
  card: {
    marginBottom: SPACING.lg,
    elevation: ELEVATION.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'center',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  studentId: {
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontSize: 12,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontSize: 14,
  },
  editButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  logoutButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  bottomPadding: {
    height: SPACING.xl,
  },
})

