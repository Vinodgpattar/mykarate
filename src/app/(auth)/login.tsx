import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { TextInput, Button, Text, Card, Snackbar } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { logger } from '@/lib/logger'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  const { signIn } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (loading) {
      return
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      setSnackbarVisible(true)
      return
    }

    setLoading(true)
    setError('')

    try {
      logger.debug('Attempting login', { email: email.trim() })
      await signIn(email.trim(), password)
      logger.info('Login successful - navigating to index for role detection')
      router.replace('/')
    } catch (err: any) {
      logger.error('Login error', err instanceof Error ? err : new Error(String(err)))
      let errorMessage = err.message || 'Failed to login. Please check your credentials.'
      
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('Invalid')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account before logging in.'
      }
      
      setError(errorMessage)
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="karate" size={80} color="#7B2CBF" />
          </View>

          {/* Header */}
          <Text variant="headlineMedium" style={styles.title}>
            Karate Dojo
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to access your dashboard
          </Text>

          {/* Login Card */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* Email Input */}
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" />}
                style={styles.input}
                disabled={loading}
              />

              {/* Password Input */}
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                disabled={loading}
              />

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor="#7B2CBF"
              >
                Sign In
              </Button>
            </Card.Content>
          </Card>

          {/* Footer */}
          <Text variant="bodySmall" style={styles.footer}>
            Secure access to your dojo dashboard
          </Text>
        </View>
      </ScrollView>

      {/* Error Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error || 'An error occurred'}
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
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
  },
})



