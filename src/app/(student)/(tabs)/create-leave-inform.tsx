import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, Divider } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getStudentByUserId } from '@/lib/students'
import { createLeaveInform } from '@/lib/student-leave-informs'
import { logger } from '@/lib/logger'
import { StudentHeader } from '@/components/student/StudentHeader'
import { COLORS, SPACING, RADIUS, ELEVATION } from '@/lib/design-system'

export default function CreateLeaveInformScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [error, setError] = useState<string | null>(null)

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
      setError('Student profile not found')
      setSnackbar({ visible: true, message: 'Student profile not found' })
      return
    }

    const trimmedMessage = message.trim()
    if (trimmedMessage.length < 10) {
      setError('Message must be at least 10 characters')
      return
    }

    setError(null)

    try {
      setLoading(true)
      const result = await createLeaveInform(studentId, { message: trimmedMessage })

      if (result.error) {
        setError(result.error.message)
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      setSnackbar({ visible: true, message: 'Your teacher has been informed. Thank you!' })
      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (error) {
      logger.error('Unexpected error creating leave inform', error as Error)
      setError('Failed to send inform. Please try again.')
      setSnackbar({ visible: true, message: 'Failed to send inform. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StudentHeader 
        title="Inform Your Teacher"
        subtitle="Let your teacher know you won't be able to attend class"
        showBackButton
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoCardContent}>
              <View style={styles.infoIconContainer}>
                <MaterialCommunityIcons name="information-outline" size={24} color={COLORS.info} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text variant="titleSmall" style={styles.infoTitle}>
                  Inform Your Teacher
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Let your teacher know in advance if you won't be able to attend class. This helps with attendance planning.
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Message Form Card */}
          <Card style={styles.formCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Leave Message *
              </Text>
              
              <TextInput
                mode="outlined"
                label="Your Message"
                placeholder="e.g., I'm not feeling well and won't be able to attend class for a few days."
                value={message}
                onChangeText={(text) => {
                  setMessage(text)
                  if (error) setError(null)
                }}
                multiline
                numberOfLines={6}
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                maxLength={500}
                disabled={loading}
                error={!!error}
                outlineColor={error ? COLORS.error : COLORS.border}
                activeOutlineColor={error ? COLORS.error : COLORS.brandPurple}
              />
              
              {error && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.helperContainer}>
                <Text variant="bodySmall" style={styles.helperText}>
                  {message.length}/500 characters
                </Text>
                {message.trim().length > 0 && message.trim().length < 10 && (
                  <Text variant="bodySmall" style={styles.helperWarning}>
                    Minimum 10 characters required
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || message.trim().length < 10}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            buttonColor={COLORS.brandPurple}
            labelStyle={styles.submitButtonLabel}
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="send" size={size} color={color} />
            )}
          >
            Send Inform to Teacher
          </Button>

          {/* Guidelines Card */}
          <Card style={styles.guidelinesCard}>
            <Card.Content>
              <View style={styles.guidelinesHeader}>
                <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.warning} />
                <Text variant="titleSmall" style={styles.guidelinesTitle}>
                  Tips for Writing Your Message
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.guidelinesList}>
                <View style={styles.guidelineItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                  <Text variant="bodySmall" style={styles.guidelineText}>
                    Be specific about the reason and duration
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                  <Text variant="bodySmall" style={styles.guidelineText}>
                    Inform as early as possible
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                  <Text variant="bodySmall" style={styles.guidelineText}>
                    Include any relevant details your teacher should know
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  // Info Card
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    elevation: ELEVATION.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoCardContent: {
    padding: SPACING.md,
  },
  infoIconContainer: {
    marginBottom: SPACING.sm,
  },
  infoTextContainer: {
    gap: SPACING.xs,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  infoText: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Form Card
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    elevation: ELEVATION.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  textInputContent: {
    minHeight: 140,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    flex: 1,
  },
  helperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  helperWarning: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '500',
  },
  // Submit Button
  submitButton: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    elevation: ELEVATION.sm,
  },
  submitButtonContent: {
    paddingVertical: SPACING.sm,
  },
  submitButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Guidelines Card
  guidelinesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    elevation: ELEVATION.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  guidelinesTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  divider: {
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.borderLight,
  },
  guidelinesList: {
    gap: SPACING.sm,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  guidelineText: {
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
})

