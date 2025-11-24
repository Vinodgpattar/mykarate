import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, ActivityIndicator, Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { createLeaveInform } from '@/lib/student-leave-informs'
import { logger } from '@/lib/logger'

export default function CreateLeaveInformScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    loadStudent()
  }, [user])

  const loadStudent = async () => {
    if (!user?.id) return

    try {
      const result = await getStudentByUserId(user.id)
      if (result.student) {
        setStudentId(result.student.id)
      } else {
        setSnackbar({ visible: true, message: 'Student profile not found' })
        router.back()
      }
    } catch (error) {
      logger.error('Error loading student', error as Error)
      setSnackbar({ visible: true, message: 'Failed to load student profile' })
      router.back()
    }
  }

  const handleSubmit = async () => {
    if (!studentId) {
      setSnackbar({ visible: true, message: 'Student profile not found' })
      return
    }

    const trimmedMessage = message.trim()
    if (trimmedMessage.length < 10) {
      setSnackbar({ visible: true, message: 'Message must be at least 10 characters' })
      return
    }

    try {
      setLoading(true)
      const result = await createLeaveInform(studentId, { message: trimmedMessage })

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      setSnackbar({ visible: true, message: 'Your teacher has been informed. Thank you!' })
      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (error) {
      logger.error('Unexpected error creating leave inform', error as Error)
      setSnackbar({ visible: true, message: 'Failed to send inform. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Inform Your Teacher
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Let your teacher know you won't be able to attend class
          </Text>
        </View>

        <View style={styles.form}>
          <Text variant="labelLarge" style={styles.label}>
            Message *
          </Text>
          <TextInput
            mode="outlined"
            placeholder="e.g., I'm not feeling well and won't be able to attend class for a few days."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            style={styles.textInput}
            contentStyle={styles.textInputContent}
            maxLength={500}
            disabled={loading}
          />
          <Text variant="bodySmall" style={styles.helperText}>
            {message.length}/500 characters (minimum 10)
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || message.trim().length < 10}
          style={styles.submitButton}
          buttonColor="#7B2CBF"
        >
          Send Inform
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  textInputContent: {
    minHeight: 120,
    paddingTop: 12,
  },
  helperText: {
    color: '#6B7280',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
})

