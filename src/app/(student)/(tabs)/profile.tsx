import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Snackbar, ProgressBar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId, updateStudent, type UpdateStudentData } from '@/lib/students'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'

export default function StudentProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    if (user?.id) {
      loadStudent()
    }
  }, [user])

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            My Profile
          </Text>
        </View>

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
              <ProgressBar progress={completion / 100} color="#7B2CBF" style={styles.progressBar} />
              <Text variant="bodySmall" style={styles.completionText}>
                {completion}% Complete
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/(student)/(tabs)/complete-profile')}
                style={styles.completeButton}
                buttonColor="#7B2CBF"
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
                  <MaterialCommunityIcons name="account" size={40} color="#7B2CBF" />
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
              <MaterialCommunityIcons name="account" size={24} color="#7B2CBF" />
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
      <MaterialCommunityIcons name={icon as any} size={18} color="#6B7280" />
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  completionCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  completionTitle: {
    fontWeight: '600',
    color: '#D97706',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  completionText: {
    color: '#92400E',
    marginBottom: 12,
  },
  completeButton: {
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
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
    color: '#1F2937',
    marginBottom: 4,
  },
  studentId: {
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    color: '#1F2937',
    fontWeight: '500',
  },
  editButton: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 20,
  },
})

