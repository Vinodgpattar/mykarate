import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { createStudent, type CreateStudentData } from '@/lib/students'
import { getBranches, type Branch } from '@/lib/branches'
import { getProfileByUserId } from '@/lib/profiles'

export default function CreateStudentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    branchId: '',
    phone: '',
  })

  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    branchId?: string
    phone?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [successData, setSuccessData] = useState<{ studentId: string; email: string; password: string } | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      setLoadingBranches(true)
      const result = await getBranches()
      if (result.branches) {
        // Filter branches based on role
        if (user?.id) {
          const profile = await getProfileByUserId(user.id)
          if (profile.profile?.role === 'super_admin') {
            // Super admin sees all branches
            setBranches(result.branches as Branch[])
          } else if (profile.profile?.role === 'admin' && profile.profile.branchId) {
            // Branch admin sees only their branch
            setBranches(result.branches.filter((b) => b.id === profile.profile?.branchId) as Branch[])
            // Auto-select their branch
            setFormData((prev) => ({ ...prev, branchId: profile.profile!.branchId! }))
          }
        }
      }
    } catch (error) {
      setSnackbarMessage('Failed to load branches')
      setSnackbarVisible(true)
    } finally {
      setLoadingBranches(false)
    }
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true // Optional field
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.trim().replace(/\s/g, ''))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate branch
    if (!formData.branchId) {
      newErrors.branchId = 'Branch is required'
    }

    // Validate phone (optional)
    if (formData.phone.trim() && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSnackbarMessage('Please fix the errors in the form')
      setSnackbarVisible(true)
      return
    }

    setErrors({})

    if (!user?.id) {
      setSnackbarMessage('User not authenticated')
      setSnackbarVisible(true)
      return
    }

    try {
      setLoading(true)

      const createData: CreateStudentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        branchId: formData.branchId,
        phone: formData.phone.trim() || undefined,
      }

      const result = await createStudent(createData, user.id)

      if (result.error) {
        setSnackbarMessage(result.error.message)
        setSnackbarVisible(true)
      } else if (result.student && result.password) {
        // Show success with credentials
        setSuccessData({
          studentId: result.student.student_id,
          email: result.student.email,
          password: result.password,
        })
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create student'
      setSnackbarMessage(errorMessage)
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (successData) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={80} color="#10B981" />
          </View>
          <Text variant="headlineMedium" style={styles.successTitle}>
            Student Created Successfully!
          </Text>
          <Text variant="bodyMedium" style={styles.successSubtitle}>
            Credentials have been sent to the student's email
          </Text>

          <Card style={styles.credentialsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.credentialsTitle}>
                Student Credentials
              </Text>
              <View style={styles.credentialRow}>
                <Text variant="bodyMedium" style={styles.credentialLabel}>
                  Student ID:
                </Text>
                <View style={styles.credentialValue}>
                  <Text variant="bodyLarge" style={styles.credentialText}>
                    {successData.studentId}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Copy to clipboard
                      // Clipboard.setString(successData.studentId)
                    }}
                    style={styles.copyButton}
                  >
                    <MaterialCommunityIcons name="content-copy" size={20} color="#7B2CBF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.credentialRow}>
                <Text variant="bodyMedium" style={styles.credentialLabel}>
                  Email:
                </Text>
                <Text variant="bodyLarge" style={styles.credentialText}>
                  {successData.email}
                </Text>
              </View>
              <View style={styles.credentialRow}>
                <Text variant="bodyMedium" style={styles.credentialLabel}>
                  Password:
                </Text>
                <View style={styles.credentialValue}>
                  <Text variant="bodyLarge" style={styles.credentialText}>
                    {successData.password}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Copy to clipboard
                      // Clipboard.setString(successData.password)
                    }}
                    style={styles.copyButton}
                  >
                    <MaterialCommunityIcons name="content-copy" size={20} color="#7B2CBF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
            <Text variant="bodySmall" style={styles.infoText}>
              The student will receive these credentials via email. They can log in and complete their profile.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => {
                setSuccessData(null)
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  branchId: '',
                  phone: '',
                })
                setErrors({})
              }}
              style={styles.actionButton}
            >
              Add Another
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/(admin)/(tabs)/students')}
              style={styles.actionButton}
              buttonColor="#7B2CBF"
            >
              View Students
            </Button>
          </View>
        </ScrollView>
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
        {/* Header */}
        <View style={styles.header}>
          <Button
            icon="arrow-left"
            onPress={() => router.back()}
            mode="text"
            textColor="#666"
          >
            Back
          </Button>
          <Text variant="headlineSmall" style={styles.title}>
            Add New Student
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
              <Text variant="bodySmall" style={styles.infoText}>
                Enter basic information. The student will receive login credentials via email and can complete their profile later.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Form Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-plus" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Student Information *
              </Text>
            </View>

            {/* First Name */}
            <TextInput
              label="First Name *"
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData({ ...formData, firstName: text })
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: undefined })
                }
              }}
              mode="outlined"
              placeholder="Enter first name"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.firstName}
              left={<TextInput.Icon icon="account" />}
              disabled={loading}
            />
            {errors.firstName && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.firstName}
                </Text>
              </View>
            )}

            {/* Last Name */}
            <TextInput
              label="Last Name *"
              value={formData.lastName}
              onChangeText={(text) => {
                setFormData({ ...formData, lastName: text })
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: undefined })
                }
              }}
              mode="outlined"
              placeholder="Enter last name"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.lastName}
              left={<TextInput.Icon icon="account" />}
              disabled={loading}
            />
            {errors.lastName && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.lastName}
                </Text>
              </View>
            )}

            {/* Email */}
            <TextInput
              label="Email Address *"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text })
                if (errors.email) {
                  setErrors({ ...errors, email: undefined })
                }
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="student@example.com"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.email}
              left={<TextInput.Icon icon="email" />}
              disabled={loading}
            />
            {errors.email && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.email}
                </Text>
              </View>
            )}

            {/* Branch */}
            {loadingBranches ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#7B2CBF" />
                <Text variant="bodySmall" style={styles.loadingText}>
                  Loading branches...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.branchSelector}>
                  <MaterialCommunityIcons name="office-building" size={20} color="#666" style={styles.branchIcon} />
                  <Text variant="bodyMedium" style={styles.branchLabel}>
                    Branch *
                  </Text>
                </View>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    onPress={() => {
                      setFormData({ ...formData, branchId: branch.id })
                      if (errors.branchId) {
                        setErrors({ ...errors, branchId: undefined })
                      }
                    }}
                    style={[
                      styles.branchOption,
                      formData.branchId === branch.id && styles.branchOptionSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={formData.branchId === branch.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={formData.branchId === branch.id ? '#7B2CBF' : '#9CA3AF'}
                    />
                    <View style={styles.branchOptionContent}>
                      <Text variant="bodyMedium" style={styles.branchOptionName}>
                        {branch.name}
                      </Text>
                      {branch.code && (
                        <Text variant="bodySmall" style={styles.branchOptionCode}>
                          {branch.code}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {errors.branchId && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                    <Text variant="bodySmall" style={styles.error}>
                      {errors.branchId}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Phone */}
            <TextInput
              label="Phone (optional)"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text })
                if (errors.phone) {
                  setErrors({ ...errors, phone: undefined })
                }
              }}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder="+1234567890"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.phone}
              left={<TextInput.Icon icon="phone" />}
              disabled={loading}
            />
            {errors.phone && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.phone}
                </Text>
              </View>
            )}
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
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            buttonColor="#7B2CBF"
          >
            Create Student
          </Button>
        </View>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  error: {
    color: '#D97706',
    fontSize: 14,
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 16,
  },
  loadingText: {
    color: '#666',
  },
  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  branchIcon: {
    marginLeft: 4,
  },
  branchLabel: {
    fontWeight: '500',
    color: '#1a1a1a',
  },
  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  branchOptionSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7B2CBF',
  },
  branchOptionContent: {
    flex: 1,
  },
  branchOptionName: {
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  branchOptionCode: {
    color: '#6B7280',
    fontSize: 12,
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
  // Success screen styles
  successContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  credentialsCard: {
    width: '100%',
    marginBottom: 24,
    elevation: 2,
    borderRadius: 12,
  },
  credentialsTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  credentialRow: {
    marginBottom: 16,
  },
  credentialLabel: {
    color: '#6B7280',
    marginBottom: 4,
  },
  credentialValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  credentialText: {
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
})

