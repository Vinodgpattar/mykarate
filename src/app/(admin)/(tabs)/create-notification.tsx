import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, Menu, RadioButton, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { createNotification, pickImageFromGallery, takePhotoWithCamera, type NotificationType, type TargetType } from '@/lib/admin-notifications'
import { getBranches, type Branch } from '@/lib/branches'
import { getStudents, type Student } from '@/lib/students'
import { logger } from '@/lib/logger'
import { AdminHeader } from '@/components/admin/AdminHeader'

const NOTIFICATION_TYPES: NotificationType[] = ['announcement', 'alert', 'reminder', 'achievement', 'event', 'payment', 'class', 'system']

const TYPE_LABELS: Record<NotificationType, string> = {
  announcement: 'Announcement',
  alert: 'Alert',
  reminder: 'Reminder',
  achievement: 'Achievement',
  event: 'Event',
  payment: 'Payment',
  class: 'Class',
  system: 'System',
}

export default function CreateNotificationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as NotificationType,
    targetType: 'all' as TargetType,
    targetBranchId: '',
    targetStudentIds: [] as string[],
  })

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [errors, setErrors] = useState<{
    title?: string
    message?: string
    targetType?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [typeMenuVisible, setTypeMenuVisible] = useState(false)
  const [branchMenuVisible, setBranchMenuVisible] = useState(false)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (formData.targetType === 'branch' && formData.targetBranchId) {
      loadStudentsForBranch(formData.targetBranchId)
    } else if (formData.targetType === 'students') {
      loadAllStudents()
    }
  }, [formData.targetType, formData.targetBranchId])

  const loadBranches = async () => {
    try {
      const result = await getBranches()
      if (result.branches) {
        setBranches(result.branches as Branch[])
      }
    } catch (error) {
      logger.error('Error loading branches', error as Error)
    }
  }

  const loadStudentsForBranch = async (branchId: string) => {
    try {
      setLoadingStudents(true)
      const result = await getStudents({ branchId, limit: 1000 })
      if (result.students) {
        setStudents(result.students)
      }
    } catch (error) {
      logger.error('Error loading students', error as Error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const loadAllStudents = async () => {
    try {
      setLoadingStudents(true)
      const result = await getStudents({ limit: 1000 })
      if (result.students) {
        setStudents(result.students)
      }
    } catch (error) {
      logger.error('Error loading students', error as Error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const handlePickImage = async () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: async () => {
          const result = await takePhotoWithCamera()
          if (result.error) {
            setSnackbarMessage(result.error.message)
            setSnackbarVisible(true)
          } else if (result.uri) {
            setImageUri(result.uri)
          }
        }},
        { text: 'Gallery', onPress: async () => {
          const result = await pickImageFromGallery()
          if (result.error) {
            setSnackbarMessage(result.error.message)
            setSnackbarVisible(true)
          } else if (result.uri) {
            setImageUri(result.uri)
          }
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    }

    if (formData.targetType === 'branch' && !formData.targetBranchId) {
      newErrors.targetType = 'Please select a branch'
    }

    if (formData.targetType === 'students' && formData.targetStudentIds.length === 0) {
      newErrors.targetType = 'Please select at least one student'
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

      const result = await createNotification(
        {
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type,
          imageUri: imageUri || undefined,
          targetType: formData.targetType,
          targetBranchId: formData.targetBranchId || undefined,
          targetStudentIds: formData.targetStudentIds.length > 0 ? formData.targetStudentIds : undefined,
        },
        user.id
      )

      if (result.error) {
        setSnackbarMessage(result.error.message)
        setSnackbarVisible(true)
      } else {
        setSnackbarMessage('Notification sent successfully!')
        setSnackbarVisible(true)
        setTimeout(() => router.back(), 1500)
      }
    } catch (error) {
      logger.error('Unexpected error creating notification', error as Error)
      setSnackbarMessage('Failed to send notification')
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetStudentIds: prev.targetStudentIds.includes(studentId)
        ? prev.targetStudentIds.filter((id) => id !== studentId)
        : [...prev.targetStudentIds, studentId],
    }))
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}>
      <AdminHeader title="Create Notification" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Notification Type */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notification Type *
            </Text>
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (typeMenuVisible) {
                      setTypeMenuVisible(false)
                    } else {
                      setTimeout(() => setTypeMenuVisible(true), 50)
                    }
                  }}
                  style={styles.menuButton}
                  contentStyle={styles.menuButtonContent}
                >
                  {TYPE_LABELS[formData.type]}
                </Button>
              }
            >
              {NOTIFICATION_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, type }))
                    setTypeMenuVisible(false)
                  }}
                  title={TYPE_LABELS[type]}
                />
              ))}
            </Menu>
          </Card.Content>
        </Card>

        {/* Title and Message */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Content *
            </Text>

            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, title: text }))
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
              }}
              mode="outlined"
              placeholder="Enter notification title"
              style={styles.input}
              error={!!errors.title}
              disabled={loading}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

            <TextInput
              label="Message *"
              value={formData.message}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, message: text }))
                if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
              }}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Enter notification message"
              style={styles.input}
              error={!!errors.message}
              disabled={loading}
            />
            {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
          </Card.Content>
        </Card>

        {/* Image Upload */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Image (Optional)
            </Text>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <Button mode="outlined" onPress={() => setImageUri(null)} style={styles.removeImageButton}>
                  Remove
                </Button>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.imagePickerButton}
                disabled={loading}
              >
                <MaterialCommunityIcons name="image-plus" size={32} color="#7B2CBF" />
                <Text style={styles.imagePickerText}>Add Image</Text>
                <Text style={styles.imagePickerSubtext}>Camera or Gallery</Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {/* Target Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Target Audience *
            </Text>

            <RadioButton.Group
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  targetType: value as TargetType,
                  targetBranchId: '',
                  targetStudentIds: [],
                }))
                if (errors.targetType) setErrors((prev) => ({ ...prev, targetType: undefined }))
              }}
              value={formData.targetType}
            >
              <View style={styles.radioOption}>
                <RadioButton value="all" />
                <Text variant="bodyLarge" onPress={() => setFormData((prev) => ({ ...prev, targetType: 'all' }))}>
                  All Students
                </Text>
              </View>

              <View style={styles.radioOption}>
                <RadioButton value="branch" />
                <Text variant="bodyLarge" onPress={() => setFormData((prev) => ({ ...prev, targetType: 'branch' }))}>
                  Specific Branch
                </Text>
              </View>

              {formData.targetType === 'branch' && (
                <View style={styles.branchSelector}>
                  <Menu
                    visible={branchMenuVisible}
                    onDismiss={() => setBranchMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => {
                          if (branchMenuVisible) {
                            setBranchMenuVisible(false)
                          } else {
                            setTimeout(() => setBranchMenuVisible(true), 50)
                          }
                        }}
                        style={styles.menuButton}
                        contentStyle={styles.menuButtonContent}
                      >
                        {formData.targetBranchId ? branches.find((b) => b.id === formData.targetBranchId)?.name || 'Select Branch' : 'Select Branch'}
                      </Button>
                    }
                  >
                    {branches.map((branch) => (
                      <Menu.Item
                        key={branch.id}
                        onPress={() => {
                          setFormData((prev) => ({ ...prev, targetBranchId: branch.id }))
                          setBranchMenuVisible(false)
                        }}
                        title={branch.name}
                      />
                    ))}
                  </Menu>
                </View>
              )}

              <View style={styles.radioOption}>
                <RadioButton value="students" />
                <Text variant="bodyLarge" onPress={() => setFormData((prev) => ({ ...prev, targetType: 'students' }))}>
                  Specific Students
                </Text>
              </View>

              {formData.targetType === 'students' && (
                <View style={styles.studentSelector}>
                  {loadingStudents ? (
                    <ActivityIndicator size="small" color="#7B2CBF" />
                  ) : (
                    <ScrollView style={styles.studentList} nestedScrollEnabled>
                      {students.map((student) => (
                        <TouchableOpacity
                          key={student.id}
                          onPress={() => toggleStudentSelection(student.id)}
                          style={[
                            styles.studentItem,
                            formData.targetStudentIds.includes(student.id) && styles.studentItemSelected,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={formData.targetStudentIds.includes(student.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={24}
                            color={formData.targetStudentIds.includes(student.id) ? '#7B2CBF' : '#9CA3AF'}
                          />
                          <Text variant="bodyMedium" style={styles.studentName}>
                            {student.first_name} {student.last_name} ({student.student_id})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  {formData.targetStudentIds.length > 0 && (
                    <Text variant="bodySmall" style={styles.selectedCount}>
                      {formData.targetStudentIds.length} student(s) selected
                    </Text>
                  )}
                </View>
              )}
            </RadioButton.Group>

            {errors.targetType && <Text style={styles.errorText}>{errors.targetType}</Text>}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton} disabled={loading}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.submitButton} buttonColor="#7B2CBF">
            Send Notification
          </Button>
        </View>
      </ScrollView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={4000}>
        {snackbarMessage}
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
  },
  card: {
    elevation: 2,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    marginTop: 8,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  imagePickerSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  branchSelector: {
    marginLeft: 32,
    marginBottom: 16,
  },
  studentSelector: {
    marginLeft: 32,
    marginTop: 8,
    maxHeight: 200,
  },
  studentList: {
    maxHeight: 200,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  studentItemSelected: {
    backgroundColor: '#F3E8FF',
  },
  studentName: {
    marginLeft: 12,
    flex: 1,
  },
  selectedCount: {
    marginTop: 8,
    color: '#7B2CBF',
    fontWeight: '600',
  },
  menuButton: {
    width: '100%',
  },
  menuButtonContent: {
    justifyContent: 'space-between',
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

