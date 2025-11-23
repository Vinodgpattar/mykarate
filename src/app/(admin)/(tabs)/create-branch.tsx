import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, Checkbox } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { createBranch, updateBranch, getBranchById, type CreateBranchData, type UpdateBranchData } from '@/lib/branches'

export default function CreateBranchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const isEdit = !!params.id

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })

  const [adminData, setAdminData] = useState({
    assignAdmin: false,
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminAddress: '',
    adminQualifications: '',
    adminExperience: '',
    adminSpecialization: '',
    sendEmail: true,
  })

  const [errors, setErrors] = useState<{
    name?: string
    address?: string
    phone?: string
    email?: string
    adminName?: string
    adminEmail?: string
    adminPhone?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [loadingBranch, setLoadingBranch] = useState(isEdit)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  React.useEffect(() => {
    if (isEdit && params.id) {
      loadBranch(params.id as string)
    }
  }, [isEdit, params.id])

  const loadBranch = async (branchId: string) => {
    try {
      setLoadingBranch(true)
      const result = await getBranchById(branchId)
      if (result.error) {
        setSnackbarMessage(result.error.message)
        setSnackbarVisible(true)
        router.back()
      } else if (result.branch) {
        setFormData({
          name: result.branch.name,
          address: result.branch.address || '',
          phone: result.branch.phone || '',
          email: result.branch.email || '',
        })
      }
    } catch (error) {
      setSnackbarMessage('Failed to load branch')
      setSnackbarVisible(true)
      router.back()
    } finally {
      setLoadingBranch(false)
    }
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true // Optional field
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.trim().replace(/\s/g, ''))
  }

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}

    // Validate branch name
    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Branch name must be at least 3 characters'
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters'
    }

    // Validate phone (optional)
    if (formData.phone.trim() && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Validate email (optional)
    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Admin assignment is disabled - Super Admin manages all branches directly
    // Admin validation removed - no branch admins will be assigned
    // if (adminData.assignAdmin) {
    //   if (!adminData.adminName.trim()) {
    //     newErrors.adminName = 'Admin name is required'
    //   } else if (adminData.adminName.trim().length < 2) {
    //     newErrors.adminName = 'Admin name must be at least 2 characters'
    //   }
    //
    //   if (!adminData.adminEmail.trim()) {
    //     newErrors.adminEmail = 'Admin email is required'
    //   } else if (!validateEmail(adminData.adminEmail)) {
    //     newErrors.adminEmail = 'Please enter a valid email address'
    //   }
    //
    //   if (adminData.adminPhone.trim() && !validatePhone(adminData.adminPhone)) {
    //     newErrors.adminPhone = 'Please enter a valid phone number'
    //   }
    // }

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

      if (isEdit && params.id) {
        // Update branch
        const updateData: UpdateBranchData = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
        }

        const result = await updateBranch(params.id as string, updateData, user.id)

        if (result.error) {
          setSnackbarMessage(result.error.message)
          setSnackbarVisible(true)
        } else {
          setSnackbarMessage('Branch updated successfully!')
          setSnackbarVisible(true)
          setTimeout(() => router.back(), 1500)
        }
      } else {
        // Create branch - Admin assignment disabled: Super Admin manages all branches
        const createData: CreateBranchData = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          assignAdmin: false, // Always false - Super Admin manages all branches directly
          // Admin assignment fields disabled - uncomment to re-enable:
          // adminName: adminData.assignAdmin ? adminData.adminName.trim() : undefined,
          // adminEmail: adminData.assignAdmin ? adminData.adminEmail.trim() : undefined,
          // adminPhone: adminData.assignAdmin && adminData.adminPhone.trim() ? adminData.adminPhone.trim() : undefined,
          // adminAddress: adminData.assignAdmin && adminData.adminAddress.trim() ? adminData.adminAddress.trim() : undefined,
          // adminQualifications: adminData.assignAdmin && adminData.adminQualifications.trim() ? adminData.adminQualifications.trim() : undefined,
          // adminExperience: adminData.assignAdmin && adminData.adminExperience.trim() ? adminData.adminExperience.trim() : undefined,
          // adminSpecialization: adminData.assignAdmin && adminData.adminSpecialization.trim() ? adminData.adminSpecialization.trim() : undefined,
          // sendEmail: adminData.sendEmail,
        }

        const result = await createBranch(createData, user.id)

        if (result.error) {
          setSnackbarMessage(result.error.message)
          setSnackbarVisible(true)
        } else {
          setSnackbarMessage(`Branch "${result.branch?.name}" created successfully!`)
          setSnackbarVisible(true)
          setTimeout(() => router.back(), 1500)
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save branch'
      setSnackbarMessage(errorMessage)
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  if (loadingBranch) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading branch...</Text>
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
            {isEdit ? 'Edit Branch' : 'Create Branch'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Branch Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="office-building" size={24} color="#6366F1" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Branch Information *
              </Text>
            </View>

            {/* Branch Name */}
            <TextInput
              label="Branch Name *"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text })
                if (errors.name) {
                  setErrors({ ...errors, name: undefined })
                }
              }}
              mode="outlined"
              placeholder="e.g., Downtown Dojo, Main Branch"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.name}
              left={<TextInput.Icon icon="office-building" />}
              disabled={loading}
            />
            {errors.name && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.name}
                </Text>
              </View>
            )}

            {/* Address */}
            <TextInput
              label="Address *"
              value={formData.address}
              onChangeText={(text) => {
                setFormData({ ...formData, address: text })
                if (errors.address) {
                  setErrors({ ...errors, address: undefined })
                }
              }}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Enter full branch address"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              error={!!errors.address}
              left={<TextInput.Icon icon="map-marker" />}
              disabled={loading}
            />
            {errors.address && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.error}>
                  {errors.address}
                </Text>
              </View>
            )}

            {/* Phone and Email Row */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
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
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  label="Email (optional)"
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
                  placeholder="branch@example.com"
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
              </View>
            </View>

            {/* Info about auto-generated code */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
              <Text variant="bodySmall" style={styles.infoText}>
                Branch code will be auto-generated (e.g., BR001, BR002)
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Admin Assignment Card - DISABLED: Super Admin manages all branches directly */}
        {/* Branch Admin assignment is disabled. Super Admin manages all branches. */}
        {/* Uncomment the section below to re-enable branch admin assignment in the future */}
        {/*
        {!isEdit && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-tie" size={24} color="#7B2CBF" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Assign Branch Admin
                </Text>
              </View>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={adminData.assignAdmin ? 'checked' : 'unchecked'}
                  onPress={() => setAdminData({ ...adminData, assignAdmin: !adminData.assignAdmin })}
                  disabled={loading}
                />
                <Text
                  variant="bodyMedium"
                  style={styles.checkboxLabel}
                  onPress={() => setAdminData({ ...adminData, assignAdmin: !adminData.assignAdmin })}
                >
                  Assign an admin to this branch
                </Text>
              </View>

              {adminData.assignAdmin && (
                <View style={styles.adminFields}>
                  <TextInput
                    label="Admin Full Name *"
                    value={adminData.adminName}
                    onChangeText={(text) => {
                      setAdminData({ ...adminData, adminName: text })
                      if (errors.adminName) {
                        setErrors({ ...errors, adminName: undefined })
                      }
                    }}
                    mode="outlined"
                    placeholder="Enter admin full name"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    error={!!errors.adminName}
                    left={<TextInput.Icon icon="account" />}
                    disabled={loading}
                  />
                  {errors.adminName && (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                      <Text variant="bodySmall" style={styles.error}>
                        {errors.adminName}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    label="Admin Email *"
                    value={adminData.adminEmail}
                    onChangeText={(text) => {
                      setAdminData({ ...adminData, adminEmail: text })
                      if (errors.adminEmail) {
                        setErrors({ ...errors, adminEmail: undefined })
                      }
                    }}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="admin@example.com"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    error={!!errors.adminEmail}
                    left={<TextInput.Icon icon="email" />}
                    disabled={loading}
                  />
                  {errors.adminEmail && (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                      <Text variant="bodySmall" style={styles.error}>
                        {errors.adminEmail}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    label="Admin Phone (optional)"
                    value={adminData.adminPhone}
                    onChangeText={(text) => {
                      setAdminData({ ...adminData, adminPhone: text })
                      if (errors.adminPhone) {
                        setErrors({ ...errors, adminPhone: undefined })
                      }
                    }}
                    mode="outlined"
                    keyboardType="phone-pad"
                    placeholder="+1234567890"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    error={!!errors.adminPhone}
                    left={<TextInput.Icon icon="phone" />}
                    disabled={loading}
                  />
                  {errors.adminPhone && (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                      <Text variant="bodySmall" style={styles.error}>
                        {errors.adminPhone}
                      </Text>
                    </View>
                  )}

                  <TextInput
                    label="Admin Address (optional)"
                    value={adminData.adminAddress}
                    onChangeText={(text) => setAdminData({ ...adminData, adminAddress: text })}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    placeholder="Enter admin address"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="map-marker" />}
                    disabled={loading}
                  />

                  <TextInput
                    label="Qualifications (optional)"
                    value={adminData.adminQualifications}
                    onChangeText={(text) => setAdminData({ ...adminData, adminQualifications: text })}
                    mode="outlined"
                    placeholder="e.g., 3rd Dan Black Belt"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="certificate" />}
                    disabled={loading}
                    maxLength={200}
                  />

                  <TextInput
                    label="Experience (optional)"
                    value={adminData.adminExperience}
                    onChangeText={(text) => setAdminData({ ...adminData, adminExperience: text })}
                    mode="outlined"
                    placeholder="e.g., 15+ Years"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="clock-outline" />}
                    disabled={loading}
                    maxLength={100}
                  />

                  <TextInput
                    label="Specialization (optional)"
                    value={adminData.adminSpecialization}
                    onChangeText={(text) => setAdminData({ ...adminData, adminSpecialization: text })}
                    mode="outlined"
                    placeholder="e.g., Shotokan Karate"
                    style={styles.input}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="karate" />}
                    disabled={loading}
                    maxLength={200}
                  />

                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      status={adminData.sendEmail ? 'checked' : 'unchecked'}
                      onPress={() => setAdminData({ ...adminData, sendEmail: !adminData.sendEmail })}
                      disabled={loading}
                    />
                    <Text
                      variant="bodySmall"
                      style={styles.checkboxLabel}
                      onPress={() => setAdminData({ ...adminData, sendEmail: !adminData.sendEmail })}
                    >
                      Send welcome email with login credentials
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        */}
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
            {isEdit ? 'Update Branch' : 'Create Branch'}
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: '#6366F1',
    flex: 1,
    fontSize: 13,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#1a1a1a',
    flex: 1,
  },
  adminFields: {
    marginTop: 8,
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
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
})
