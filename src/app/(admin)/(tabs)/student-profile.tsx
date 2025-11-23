import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Snackbar, Avatar, Chip } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getStudentById, deleteStudent, type StudentWithBranch } from '@/lib/students'
import { useAuth } from '@/context/AuthContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'

const BELT_COLORS: Record<string, string> = {
  White: '#FFFFFF',
  Yellow: '#FFEB3B',
  Orange: '#FF9800',
  Green: '#4CAF50',
  Blue: '#2196F3',
  Purple: '#9C27B0',
  Brown: '#795548',
  Black: '#000000',
}

export default function StudentProfileScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const studentId = params.id as string

  const [student, setStudent] = useState<StudentWithBranch | null>(null)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    if (studentId) {
      loadStudent()
    }
  }, [studentId])

  const loadStudent = async () => {
    try {
      setLoading(true)
      const result = await getStudentById(studentId)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        router.back()
      } else if (result.student) {
        setStudent(result.student)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load student' })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    if (!student || !user?.id) return

    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.first_name} ${student.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteStudent(student.id, false, user.id) // Soft delete
              if (result.error) {
                setSnackbar({ visible: true, message: result.error.message })
              } else {
                setSnackbar({ visible: true, message: 'Student deleted successfully' })
                router.back()
              }
            } catch (error) {
              setSnackbar({ visible: true, message: 'Failed to delete student' })
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
        <Text style={styles.loadingText}>Loading student...</Text>
      </View>
    )
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#F59E0B" />
        <Text style={styles.loadingText}>Student not found</Text>
        <Button onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    )
  }

  const profileCompletion = calculateProfileCompletion(student)

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={() => router.back()} mode="text" textColor="#666">
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            Student Profile
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Profile Header Card */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              {student.student_photo_url ? (
                <Image source={{ uri: student.student_photo_url }} style={styles.profilePhoto} />
              ) : (
                <Avatar.Text
                  size={80}
                  label={`${student.first_name[0]}${student.last_name[0]}`}
                  style={styles.avatar}
                />
              )}
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.profileName}>
                  {student.first_name} {student.last_name}
                </Text>
                <Text variant="bodyMedium" style={styles.studentId}>
                  {student.student_id}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.beltBadge,
                      { backgroundColor: BELT_COLORS[student.current_belt] || '#E5E7EB' },
                    ]}
                  >
                    <Text
                      variant="labelMedium"
                      style={[
                        styles.beltText,
                        { color: student.current_belt === 'White' || student.current_belt === 'Yellow' ? '#000' : '#FFF' },
                      ]}
                    >
                      {student.current_belt} Belt
                    </Text>
                  </View>
                  {student.is_active ? (
                    <Chip icon="check-circle" style={styles.activeChip}>
                      Active
                    </Chip>
                  ) : (
                    <Chip icon="close-circle" style={styles.inactiveChip}>
                      Inactive
                    </Chip>
                  )}
                </View>
              </View>
            </View>

            {/* Profile Completion */}
            {!student.profile_completed && (
              <View style={styles.completionCard}>
                <View style={styles.completionHeader}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" />
                  <Text variant="titleSmall" style={styles.completionTitle}>
                    Profile Incomplete ({profileCompletion}%)
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.completionText}>
                  Student needs to complete their profile
                </Text>
              </View>
            )}
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
            {student.aadhar_number && (
              <InfoRow icon="card-account-details" label="Aadhar Number" value={student.aadhar_number} />
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
                  Branch Information
                </Text>
              </View>
              <InfoRow icon="office-building" label="Branch" value={student.branch.name} />
              {student.branch.code && (
                <InfoRow icon="tag" label="Branch Code" value={student.branch.code} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Parent/Guardian Information */}
        {(student.parent_name || student.parent_email || student.parent_phone) && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-group" size={24} color="#7B2CBF" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Parent/Guardian
                </Text>
              </View>
              {student.parent_name && <InfoRow icon="account" label="Name" value={student.parent_name} />}
              {student.parent_email && <InfoRow icon="email" label="Email" value={student.parent_email} />}
              {student.parent_phone && <InfoRow icon="phone" label="Phone" value={student.parent_phone} />}
              {student.parent_relation && (
                <InfoRow icon="relation-many-to-many" label="Relation" value={student.parent_relation} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Emergency Contact */}
        {(student.emergency_contact_name || student.emergency_contact_phone) && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="phone-alert" size={24} color="#F59E0B" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Emergency Contact
                </Text>
              </View>
              {student.emergency_contact_name && (
                <InfoRow icon="account" label="Name" value={student.emergency_contact_name} />
              )}
              {student.emergency_contact_phone && (
                <InfoRow icon="phone" label="Phone" value={student.emergency_contact_phone} />
              )}
              {student.emergency_contact_relation && (
                <InfoRow icon="relation-many-to-many" label="Relation" value={student.emergency_contact_relation} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Medical Information */}
        {student.medical_conditions && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="medical-bag" size={24} color="#EF4444" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Medical Information
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.medicalText}>
                {student.medical_conditions}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Documents */}
        {(student.student_photo_url || student.aadhar_card_url) && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="file-document" size={24} color="#6366F1" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Documents
                </Text>
              </View>
              {student.student_photo_url && (
                <View style={styles.documentRow}>
                  <MaterialCommunityIcons name="image" size={20} color="#6B7280" />
                  <Text variant="bodyMedium" style={styles.documentLabel}>
                    Student Photo
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Open image viewer
                    }}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={20} color="#7B2CBF" />
                  </TouchableOpacity>
                </View>
              )}
              {student.aadhar_card_url && (
                <View style={styles.documentRow}>
                  <MaterialCommunityIcons name="card-account-details" size={20} color="#6B7280" />
                  <Text variant="bodyMedium" style={styles.documentLabel}>
                    Aadhar Card
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Open image viewer
                    }}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={20} color="#7B2CBF" />
                  </TouchableOpacity>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        {student.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="note-text" size={24} color="#6366F1" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Notes
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.notesText}>
                {student.notes}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.push(`/(admin)/(tabs)/edit-student?id=${student.id}`)}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit Student
          </Button>
          <Button
            mode="outlined"
            onPress={handleDelete}
            textColor="#EF4444"
            style={styles.actionButton}
            icon="delete"
          >
            Delete
          </Button>
        </View>

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

// Info Row Component
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

// Calculate profile completion percentage
function calculateProfileCompletion(student: StudentWithBranch): number {
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
  backButton: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatar: {
    backgroundColor: '#F3E8FF',
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
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  beltBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  beltText: {
    fontWeight: '600',
  },
  activeChip: {
    backgroundColor: '#D1FAE5',
  },
  inactiveChip: {
    backgroundColor: '#FEF3C7',
  },
  completionCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completionTitle: {
    fontWeight: '600',
    color: '#D97706',
  },
  completionText: {
    color: '#92400E',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
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
  medicalText: {
    color: '#1F2937',
    lineHeight: 20,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  documentLabel: {
    flex: 1,
    color: '#1F2937',
  },
  notesText: {
    color: '#1F2937',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
})

