import { useState, useEffect } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { TextInput, Button, Text, Card, Snackbar, ActivityIndicator } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { validateResetToken, resetPassword } from '@/lib/password-reset'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const token = (params.token as string) || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setSnackbar({ visible: true, message: 'Invalid reset link. Please request a new one.' })
      setTimeout(() => router.replace('/(auth)/forgot-password'), 2000)
    }
  }, [token])

  const validateToken = async () => {
    try {
      setLoading(true)
      const result = await validateResetToken(token)

      if (result.error || !result.valid) {
        setValidToken(false)
        setSnackbar({
          visible: true,
          message: result.error?.message || 'Invalid or expired reset link',
        })
        setTimeout(() => router.replace('/(auth)/forgot-password'), 3000)
      } else {
        setValidToken(true)
      }
    } catch (error) {
      setValidToken(false)
      setSnackbar({ visible: true, message: 'Failed to validate reset link' })
      setTimeout(() => router.replace('/(auth)/forgot-password'), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}

    // Validate password
    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSnackbar({ visible: true, message: 'Please fix the errors in the form' })
      return
    }

    setErrors({})

    try {
      setSaving(true)
      const result = await resetPassword(token, password)

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        setSnackbar({ visible: true, message: 'Password reset successful! Redirecting to login...' })
        setTimeout(() => router.replace('/(auth)/login'), 2000)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to reset password. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Validating reset link...</Text>
      </View>
    )
  }

  if (!validToken) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.errorContent}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#F59E0B" />
          <Text variant="headlineMedium" style={styles.errorTitle}>
            Invalid Reset Link
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            This reset link is invalid or has expired. Please request a new one.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/(auth)/forgot-password')}
            style={styles.button}
            buttonColor="#7B2CBF"
          >
            Request New Link
          </Button>
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Button
              icon="arrow-left"
              onPress={() => router.replace('/(auth)/login')}
              mode="text"
              textColor="#666"
            >
              Back
            </Button>
            <Text variant="headlineSmall" style={styles.title}>
              Reset Password
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lock-reset" size={64} color="#7B2CBF" />
          </View>

          {/* Instructions */}
          <Text variant="bodyLarge" style={styles.instructions}>
            Enter your new password below.
          </Text>

          {/* Form Card */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="New Password *"
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined })
                  }
                }}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                disabled={saving}
                placeholder="Minimum 8 characters"
              />
              {errors.password && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                  <Text variant="bodySmall" style={styles.error}>
                    {errors.password}
                  </Text>
                </View>
              )}

              <TextInput
                label="Confirm Password *"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text)
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined })
                  }
                }}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                style={styles.input}
                disabled={saving}
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                  <Text variant="bodySmall" style={styles.error}>
                    {errors.confirmPassword}
                  </Text>
                </View>
              )}

              <View style={styles.passwordRequirements}>
                <Text variant="bodySmall" style={styles.requirementsTitle}>
                  Password Requirements:
                </Text>
                <Text variant="bodySmall" style={styles.requirement}>
                  • At least 8 characters
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={saving}
                disabled={saving || !password.trim() || !confirmPassword.trim()}
                style={styles.submitButton}
                buttonColor="#7B2CBF"
              >
                Reset Password
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructions: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
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
  passwordRequirements: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 4,
  },
  requirement: {
    color: '#075985',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
})

