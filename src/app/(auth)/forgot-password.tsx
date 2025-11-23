import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { TextInput, Button, Text, Card, Snackbar, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { requestPasswordReset } from '@/lib/password-reset'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  const handleSubmit = async () => {
    if (!email.trim()) {
      setSnackbar({ visible: true, message: 'Please enter your email address' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setSnackbar({ visible: true, message: 'Please enter a valid email address' })
      return
    }

    try {
      setLoading(true)
      const result = await requestPasswordReset(email.trim())

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        // Always show success (security: don't reveal if email exists)
        setSuccess(true)
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to send reset link. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="email-check" size={80} color="#10B981" />
          </View>
          <Text variant="headlineMedium" style={styles.successTitle}>
            Check Your Email
          </Text>
          <Text variant="bodyMedium" style={styles.successText}>
            We've sent a password reset link to:
          </Text>
          <Text variant="bodyLarge" style={styles.emailText}>
            {email}
          </Text>
          <Text variant="bodySmall" style={styles.instructionsText}>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </Text>
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
            <Text variant="bodySmall" style={styles.infoText}>
              Didn't receive the email? Check your spam folder or try again.
            </Text>
          </View>
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => {
                setSuccess(false)
                setEmail('')
              }}
              style={styles.button}
            >
              Try Another Email
            </Button>
            <Button
              mode="contained"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.button}
              buttonColor="#7B2CBF"
            >
              Back to Login
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
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
              Forgot Password
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lock-reset" size={64} color="#7B2CBF" />
          </View>

          {/* Instructions */}
          <Text variant="bodyLarge" style={styles.instructions}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Form Card */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" />}
                style={styles.input}
                disabled={loading}
                placeholder="student@example.com"
              />

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !email.trim()}
                style={styles.submitButton}
                buttonColor="#7B2CBF"
              >
                Send Reset Link
              </Button>
            </Card.Content>
          </Card>

          {/* Help Text */}
          <Text variant="bodySmall" style={styles.helpText}>
            Remember your password?{' '}
            <Text
              style={styles.linkText}
              onPress={() => router.replace('/(auth)/login')}
            >
              Sign in
            </Text>
          </Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
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
  submitButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  helpText: {
    textAlign: 'center',
    color: '#666',
  },
  linkText: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  // Success screen styles
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontWeight: '600',
    color: '#7B2CBF',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionsText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 32,
    maxWidth: '100%',
  },
  infoText: {
    color: '#6366F1',
    flex: 1,
    fontSize: 13,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
})

