import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput, Button, Text, Card, ActivityIndicator, Snackbar, Checkbox } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { assignAdminToBranch, changeBranchAdmin, getBranchById } from '@/lib/branches'

export default function AssignAdminScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const branchId = params.branchId as string

  const [adminData, setAdminData] = useState({
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
    adminName?: string
    adminEmail?: string
    adminPhone?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [loadingBranch, setLoadingBranch] = useState(true)
  const [branchName, setBranchName] = useState('')
  const [hasExistingAdmin, setHasExistingAdmin] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    if (branchId) {
      loadBranch()
    }
  }, [branchId])

  const loadBranch = async () => {
    try {
      setLoadingBranch(true)
      const result = await getBranchById(branchId)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        router.back()
      } else if (result.branch) {
        setBranchName(result.branch.name)
        setHasExistingAdmin(!!result.branch.admin)
        
        // Pre-fill admin data if exists
        if (result.branch.admin) {
          setAdminData(prev => ({
            ...prev,
            adminName: result.branch.admin?.name || '',
            adminEmail: result.branch.admin?.email || '',
            adminPhone: result.branch.admin?.phone || '',
            adminAddress: result.branch.admin?.address || '',
            adminQualifications: result.branch.admin?.qualifications || '',
            adminExperience: result.branch.admin?.experience || '',
            adminSpecialization: result.branch.admin?.specialization || '',
          }))
        }
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load branch' })
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const handleAssign = async () => {
    const newErrors: typeof errors = {}

    if (!adminData.adminName.trim()) {
      newErrors.adminName = 'Admin name is required'
    } else if (adminData.adminName.trim().length < 2) {
      newErrors.adminName = 'Admin name must be at least 2 characters'
    }

    if (!adminData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required'
    } else if (!validateEmail(adminData.adminEmail)) {
      newErrors.adminEmail = 'Please enter a valid email address'
    }

    if (adminData.adminPhone.trim() && !validatePhone(adminData.adminPhone)) {
      newErrors.adminPhone = 'Please enter a valid phone number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSnackbar({ visible: true, message: 'Please fix the errors in the form' })
      return
    }

    setErrors({})

    try {
      setLoading(true)
      let result
      
      const adminDetails = {
        phone: adminData.adminPhone.trim() || undefined,
        address: adminData.adminAddress.trim() || undefined,
        qualifications: adminData.adminQualifications.trim() || undefined,
        experience: adminData.adminExperience.trim() || undefined,
        specialization: adminData.adminSpecialization.trim() || undefined,
      }

      if (hasExistingAdmin) {
        result = await changeBranchAdmin(
          branchId,
          adminData.adminEmail.trim(),
          adminData.adminName.trim(),
          adminDetails,
          adminData.sendEmail
        )
      } else {
        result = await assignAdminToBranch(
          branchId,
          adminData.adminEmail.trim(),
          adminData.adminName.trim(),
          adminDetails,
          adminData.sendEmail
        )
      }

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        const message = hasExistingAdmin
          ? 'Branch admin changed successfully'
          : 'Admin assigned successfully'
        setSnackbar({ visible: true, message })
        if (result.password) {
          setTimeout(() => {
            setSnackbar({
              visible: true,
              message: `Password: ${result.password}\n(Email sent if enabled)`,
            })
          }, 1500)
        }
        setTimeout(() => router.back(), 3000)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to assign admin' })
    } finally {
      setLoading(false)
    }
  }

  if (loadingBranch) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
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
            {hasExistingAdmin ? 'Change Branch Admin' : 'Assign Branch Admin'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Branch Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="office-building" size={24} color="#6366F1" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Branch Information
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.branchInfo}>
              Branch: <Text style={styles.branchName}>{branchName}</Text>
            </Text>

            {hasExistingAdmin && (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert" size={20} color="#D97706" />
                <Text variant="bodySmall" style={styles.warningText}>
                  Changing the admin will remove the current admin and send them a notification email.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Admin Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-tie" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Admin Information *
              </Text>
            </View>

            {/* Admin Name */}
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

            {/* Admin Email */}
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

            {/* Admin Phone */}
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

            {/* Admin Address */}
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

            {/* Admin Qualifications */}
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

            {/* Admin Experience */}
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

            {/* Admin Specialization */}
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

            {/* Send Email Checkbox */}
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
            onPress={handleAssign}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            buttonColor="#7B2CBF"
          >
            {hasExistingAdmin ? 'Change Admin' : 'Assign Admin'}
          </Button>
        </View>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={5000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbar({ visible: false, message: '' }),
        }}
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
  branchInfo: {
    marginBottom: 8,
    color: '#666',
  },
  branchName: {
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    color: '#D97706',
    flex: 1,
    fontSize: 13,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#1a1a1a',
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
