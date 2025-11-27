import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator, Menu } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getStudentById, updateStudent, type UpdateStudentData } from '@/lib/students'
import { BELT_LEVELS, getBeltDisplayName } from '@/lib/belts'
import { DatePicker } from '@/components/shared/DatePicker'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function EditStudentScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const studentId = params.id as string

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [beltMenuVisible, setBeltMenuVisible] = useState(false)

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
        const s = result.student
        setFormData({
          firstName: s.first_name,
          lastName: s.last_name,
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
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load student' })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      const updateData: UpdateStudentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
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
      }

      const result = await updateStudent(studentId, updateData)

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        setSnackbar({ visible: true, message: 'Student updated successfully!' })
        // Navigate to students tab instead of going back
        setTimeout(() => router.push('/(admin)/(tabs)/students'), 1500)
      }
    } catch (err: any) {
      setSnackbar({ visible: true, message: err.message || 'Failed to update student' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading student...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <AdminHeader title="Edit Student" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Personal Information
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="First Name *"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  mode="outlined"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  label="Last Name *"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  mode="outlined"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
              </View>
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

            <DatePicker
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
              placeholder="Select date of birth"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              maximumDate={new Date()}
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

            <Menu
              visible={beltMenuVisible}
              onDismiss={() => setBeltMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (beltMenuVisible) {
                      setBeltMenuVisible(false)
                    } else {
                      setTimeout(() => setBeltMenuVisible(true), 50)
                    }
                  }}
                  style={styles.input}
                  icon="karate"
                >
                  {formData.currentBelt ? getBeltDisplayName(formData.currentBelt) : 'Select Current Belt'}
                </Button>
              }
            >
              {BELT_LEVELS.map((belt) => (
                <Menu.Item
                  key={belt}
                  onPress={() => {
                    setFormData({ ...formData, currentBelt: belt })
                    setBeltMenuVisible(false)
                  }}
                  title={getBeltDisplayName(belt)}
                />
              ))}
            </Menu>
          </Card.Content>
        </Card>

        {/* Parent/Guardian */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-group" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Parent/Guardian
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
                Emergency Contact
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
                Medical & Notes
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
            Update Student
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
    backgroundColor: '#FFF8E7',
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
  input: {
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
})

