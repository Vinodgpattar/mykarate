import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId, updateStudent, uploadStudentPhoto, uploadAadharCard, type UpdateStudentData } from '@/lib/students'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

export default function CompleteProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    aadharNumber: '',
    currentBelt: 'White',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentRelation: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    medicalConditions: '',
    notes: '',
  })

  const [studentPhoto, setStudentPhoto] = useState<string | null>(null)
  const [aadharPhoto, setAadharPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [studentId, setStudentId] = useState<string | null>(null)

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
        router.back()
      } else if (result.student) {
        const s = result.student
        setStudentId(s.id)
        setFormData({
          phone: s.phone || '',
          dateOfBirth: s.date_of_birth ? formatDateForInput(s.date_of_birth) : '',
          gender: s.gender || '',
          address: s.address || '',
          aadharNumber: s.aadhar_number || '',
          currentBelt: s.current_belt || 'White',
          parentName: s.parent_name || '',
          parentEmail: s.parent_email || '',
          parentPhone: s.parent_phone || '',
          parentRelation: s.parent_relation || '',
          emergencyContactName: s.emergency_contact_name || '',
          emergencyContactPhone: s.emergency_contact_phone || '',
          emergencyContactRelation: s.emergency_contact_relation || '',
          medicalConditions: s.medical_conditions || '',
          notes: s.notes || '',
        })
        setStudentPhoto(s.student_photo_url)
        setAadharPhoto(s.aadhar_card_url)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load profile' })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const pickImage = async (type: 'student' | 'aadhar') => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { 
          text: 'Camera', 
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
              setSnackbar({ visible: true, message: 'Permission to access camera is required' })
              return
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
              if (type === 'student') {
                setStudentPhoto(result.assets[0].uri)
              } else {
                setAadharPhoto(result.assets[0].uri)
              }
            }
          }
        },
        { 
          text: 'Gallery', 
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
              setSnackbar({ visible: true, message: 'Permission to access media library is required' })
              return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
              if (type === 'student') {
                setStudentPhoto(result.assets[0].uri)
              } else {
                setAadharPhoto(result.assets[0].uri)
              }
            }
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleSubmit = async () => {
    if (!studentId) return

    try {
      setSaving(true)

      // Upload images if they are new (local URIs start with file://)
      let studentPhotoUrl: string | undefined = undefined
      let aadharCardUrl: string | undefined = undefined

      if (studentPhoto && studentPhoto.startsWith('file://')) {
        const uploadResult = await uploadStudentPhoto(studentPhoto, studentId)
        if (uploadResult.error) {
          setSnackbar({ visible: true, message: `Failed to upload photo: ${uploadResult.error.message}` })
          return
        }
        studentPhotoUrl = uploadResult.url || undefined
      } else if (studentPhoto) {
        // Already a URL, use it as is
        studentPhotoUrl = studentPhoto
      }

      if (aadharPhoto && aadharPhoto.startsWith('file://')) {
        const uploadResult = await uploadAadharCard(aadharPhoto, studentId)
        if (uploadResult.error) {
          setSnackbar({ visible: true, message: `Failed to upload Aadhar card: ${uploadResult.error.message}` })
          return
        }
        aadharCardUrl = uploadResult.url || undefined
      } else if (aadharPhoto) {
        // Already a URL, use it as is
        aadharCardUrl = aadharPhoto
      }

      const updateData: UpdateStudentData = {
        phone: formData.phone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        aadharNumber: formData.aadharNumber.trim() || undefined,
        currentBelt: formData.currentBelt,
        parentName: formData.parentName.trim() || undefined,
        parentEmail: formData.parentEmail.trim() || undefined,
        parentPhone: formData.parentPhone.trim() || undefined,
        parentRelation: formData.parentRelation || undefined,
        emergencyContactName: formData.emergencyContactName.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: formData.emergencyContactRelation || undefined,
        medicalConditions: formData.medicalConditions.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        studentPhotoUrl,
        aadharCardUrl,
        profileCompleted: true, // Mark as completed
      }

      const result = await updateStudent(studentId, updateData)

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        setSnackbar({ visible: true, message: 'Profile completed successfully!' })
        setTimeout(() => router.back(), 1500)
      }
    } catch (err: any) {
      setSnackbar({ visible: true, message: err.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={() => router.back()} mode="text" textColor="#666">
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            Complete Profile
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
              <Text variant="bodySmall" style={styles.infoText}>
                Fill in your information to complete your profile. All fields are optional.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Documents */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-image" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Documents
              </Text>
            </View>

            <View style={styles.imageRow}>
              <View style={styles.imageContainer}>
                <Text variant="bodySmall" style={styles.imageLabel}>
                  Student Photo
                </Text>
                {studentPhoto ? (
                  <Image source={{ uri: studentPhoto }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="camera" size={32} color="#9CA3AF" />
                  </View>
                )}
                <Button
                  mode="outlined"
                  onPress={() => pickImage('student')}
                  style={styles.imageButton}
                  compact
                >
                  {studentPhoto ? 'Change' : 'Upload'}
                </Button>
              </View>

              <View style={styles.imageContainer}>
                <Text variant="bodySmall" style={styles.imageLabel}>
                  Aadhar Card
                </Text>
                {aadharPhoto ? (
                  <Image source={{ uri: aadharPhoto }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="card-account-details" size={32} color="#9CA3AF" />
                  </View>
                )}
                <Button
                  mode="outlined"
                  onPress={() => pickImage('aadhar')}
                  style={styles.imageButton}
                  compact
                >
                  {aadharPhoto ? 'Change' : 'Upload'}
                </Button>
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

            <TextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              mode="outlined"
              placeholder="YYYY-MM-DD"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="calendar" />}
            />

            <TextInput
              label="Gender"
              value={formData.gender}
              onChangeText={(text) => setFormData({ ...formData, gender: text })}
              mode="outlined"
              placeholder="Male, Female, Other"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="gender-male-female" />}
            />

            <TextInput
              label="Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="map-marker" />}
            />

            <TextInput
              label="Aadhar Number"
              value={formData.aadharNumber}
              onChangeText={(text) => setFormData({ ...formData, aadharNumber: text })}
              mode="outlined"
              keyboardType="numeric"
              maxLength={12}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="card-account-details" />}
            />

            <TextInput
              label="Current Belt"
              value={formData.currentBelt}
              onChangeText={(text) => setFormData({ ...formData, currentBelt: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="karate" />}
            />
          </Card.Content>
        </Card>

        {/* Parent/Guardian */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-group" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Parent/Guardian (Optional)
              </Text>
            </View>

            <TextInput
              label="Parent Name"
              value={formData.parentName}
              onChangeText={(text) => setFormData({ ...formData, parentName: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Parent Email"
              value={formData.parentEmail}
              onChangeText={(text) => setFormData({ ...formData, parentEmail: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Parent Phone"
              value={formData.parentPhone}
              onChangeText={(text) => setFormData({ ...formData, parentPhone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Parent Relation"
              value={formData.parentRelation}
              onChangeText={(text) => setFormData({ ...formData, parentRelation: text })}
              mode="outlined"
              placeholder="Father, Mother, Guardian, Other"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="relation-many-to-many" />}
            />
          </Card.Content>
        </Card>

        {/* Emergency Contact */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="phone-alert" size={24} color="#F59E0B" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Emergency Contact (Optional)
              </Text>
            </View>

            <TextInput
              label="Emergency Contact Name"
              value={formData.emergencyContactName}
              onChangeText={(text) => setFormData({ ...formData, emergencyContactName: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Emergency Contact Phone"
              value={formData.emergencyContactPhone}
              onChangeText={(text) => setFormData({ ...formData, emergencyContactPhone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Emergency Contact Relation"
              value={formData.emergencyContactRelation}
              onChangeText={(text) => setFormData({ ...formData, emergencyContactRelation: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="relation-many-to-many" />}
            />
          </Card.Content>
        </Card>

        {/* Medical & Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="#EF4444" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Medical & Notes (Optional)
              </Text>
            </View>

            <TextInput
              label="Medical Conditions"
              value={formData.medicalConditions}
              onChangeText={(text) => setFormData({ ...formData, medicalConditions: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="medical-bag" />}
            />

            <TextInput
              label="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="note-text" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Sticky Action Buttons */}
      <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={saving}
            disabled={saving}
            style={styles.submitButton}
            buttonColor="#7B2CBF"
          >
            Save Profile
          </Button>
        </View>
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={4000}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  stickyButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  infoCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    color: '#6366F1',
    flex: 1,
    fontSize: 13,
  },
  card: {
    elevation: 2,
    borderRadius: 12,
    marginBottom: 16,
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
  imageRow: {
    flexDirection: 'row',
    gap: 16,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
  },
  imageLabel: {
    marginBottom: 8,
    color: '#6B7280',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageButton: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
})

