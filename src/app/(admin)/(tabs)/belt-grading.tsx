import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Text, Card, Button, TextInput, ActivityIndicator, Snackbar, Menu } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { recordBeltGrading } from '@/lib/fees'
import { getStudentById, type Student } from '@/lib/students'
import { logger } from '@/lib/logger'
import { BELT_LEVELS, BELT_COLORS, BELT_KYU, getBeltDisplayName, getBeltIndex, isBeltHigher } from '@/lib/belts'
import { DatePicker } from '@/components/shared/DatePicker'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function BeltGradingScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const studentId = params.studentId as string

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fromBelt, setFromBelt] = useState('')
  const [toBelt, setToBelt] = useState('')
  const [gradingDate, setGradingDate] = useState(new Date().toISOString().split('T')[0])
  const [fromBeltMenuVisible, setFromBeltMenuVisible] = useState(false)
  const [toBeltMenuVisible, setToBeltMenuVisible] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    if (studentId) {
      loadStudent()
    }
  }, [studentId])

  const loadStudent = async () => {
    try {
      setLoading(true)
      const result = await getStudentById(studentId)

      if (result.error || !result.student) {
        setSnackbar({ visible: true, message: result.error?.message || 'Student not found' })
        router.back()
        return
      }

      setStudent(result.student)
      setFromBelt(result.student.current_belt || 'White')
    } catch (error) {
      logger.error('Error loading student', error as Error)
      setSnackbar({ visible: true, message: 'Failed to load student' })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user?.id || !student) return

    if (!fromBelt || !toBelt) {
      setSnackbar({ visible: true, message: 'Please select both from and to belt levels' })
      return
    }

    if (fromBelt === toBelt) {
      setSnackbar({ visible: true, message: 'From and to belt levels cannot be the same' })
      return
    }

    if (!gradingDate) {
      setSnackbar({ visible: true, message: 'Please select a grading date' })
      return
    }

    try {
      setSaving(true)
      const result = await recordBeltGrading({
        studentId: student.id,
        fromBelt,
        toBelt,
        gradingDate,
        createdById: user.id,
      })

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      setSnackbar({ visible: true, message: 'Belt grading recorded successfully! Grading fee has been created.' })
      setTimeout(() => {
        router.back()
      }, 2000)
    } catch (error) {
      logger.error('Error recording belt grading', error as Error)
      setSnackbar({ visible: true, message: 'Failed to record belt grading' })
    } finally {
      setSaving(false)
    }
  }

  const canUpgrade = (from: string, to: string) => {
    return isBeltHigher(to, from)
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading student details...</Text>
        </View>
      </View>
    )
  }

  if (!student) {
    return null
  }

  const isValidUpgrade = canUpgrade(fromBelt, toBelt)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <AdminHeader title="Belt Grading" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Student Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Student Information
            </Text>
            <View style={styles.studentInfo}>
              <View style={styles.studentDetails}>
                <Text variant="bodyLarge" style={styles.studentName}>
                  {student.first_name} {student.last_name}
                </Text>
                <Text variant="bodyMedium" style={styles.studentId}>
                  {student.student_id}
                </Text>
              </View>
              <View style={[styles.currentBeltBadge, { backgroundColor: BELT_COLORS[student.current_belt] || '#FFFFFF' }]}>
                <Text
                  variant="titleMedium"
                  style={[styles.beltText, { color: student.current_belt === 'White' || student.current_belt === 'Yellow' ? '#000' : '#FFF' }]}
                >
                  {getBeltDisplayName(student.current_belt)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Grading Form Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Grading Details
            </Text>

            <Text variant="bodyMedium" style={styles.label}>
              From Belt *
            </Text>
            <Menu
              visible={fromBeltMenuVisible}
              onDismiss={() => setFromBeltMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (fromBeltMenuVisible) {
                      setFromBeltMenuVisible(false)
                    } else {
                      setTimeout(() => setFromBeltMenuVisible(true), 50)
                    }
                  }}
                  style={styles.input}
                  icon="arrow-down"
                >
                  {fromBelt ? getBeltDisplayName(fromBelt) : 'Select From Belt'}
                </Button>
              }
            >
              {BELT_LEVELS.map((belt) => (
                <Menu.Item
                  key={belt}
                  onPress={() => {
                    setFromBelt(belt)
                    setFromBeltMenuVisible(false)
                    if (!toBelt || getBeltIndex(belt) >= getBeltIndex(toBelt)) {
                      setToBelt('')
                    }
                  }}
                  title={getBeltDisplayName(belt)}
                />
              ))}
            </Menu>

            <Text variant="bodyMedium" style={styles.label}>
              To Belt *
            </Text>
            <Menu
              visible={toBeltMenuVisible}
              onDismiss={() => setToBeltMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (toBeltMenuVisible) {
                      setToBeltMenuVisible(false)
                    } else {
                      setTimeout(() => setToBeltMenuVisible(true), 50)
                    }
                  }}
                  style={styles.input}
                  icon="arrow-up"
                  disabled={!fromBelt}
                >
                  {toBelt ? getBeltDisplayName(toBelt) : 'Select To Belt'}
                </Button>
              }
            >
              {BELT_LEVELS.filter((belt) => isBeltHigher(belt, fromBelt)).map((belt) => (
                <Menu.Item
                  key={belt}
                  onPress={() => {
                    setToBelt(belt)
                    setToBeltMenuVisible(false)
                  }}
                  title={getBeltDisplayName(belt)}
                />
              ))}
            </Menu>

            {fromBelt && toBelt && !isValidUpgrade && (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" />
                <Text variant="bodySmall" style={styles.warningText}>
                  To belt must be higher than from belt
                </Text>
              </View>
            )}

            <DatePicker
              label="Grading Date *"
              value={gradingDate}
              onChange={setGradingDate}
              placeholder="Select grading date"
              disabled={saving}
              style={styles.input}
              maximumDate={new Date()}
            />

            {fromBelt && toBelt && isValidUpgrade && (
              <View style={styles.beltPreview}>
                <View style={styles.beltTransition}>
                  <View style={[styles.beltBadge, { backgroundColor: BELT_COLORS[fromBelt] || '#FFFFFF' }]}>
                    <Text
                      variant="bodyMedium"
                      style={[styles.beltText, { color: fromBelt === 'White' || fromBelt === 'Yellow' ? '#000' : '#FFF' }]}
                    >
                      {getBeltDisplayName(fromBelt)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="arrow-right" size={24} color="#7B2CBF" />
                  <View style={[styles.beltBadge, { backgroundColor: BELT_COLORS[toBelt] || '#FFFFFF' }]}>
                    <Text
                      variant="bodyMedium"
                      style={[styles.beltText, { color: toBelt === 'White' || toBelt === 'Yellow' ? '#000' : '#FFF' }]}
                    >
                      {getBeltDisplayName(toBelt)}
                    </Text>
                  </View>
                </View>
                <Text variant="bodySmall" style={styles.previewText}>
                  Student will be upgraded from {getBeltDisplayName(fromBelt)} to {getBeltDisplayName(toBelt)}
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving || !fromBelt || !toBelt || !isValidUpgrade || !gradingDate}
              style={styles.submitButton}
              buttonColor="#7B2CBF"
              icon="trophy"
            >
              Record Grading
            </Button>
          </Card.Content>
        </Card>
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
    backgroundColor: '#FFF8E7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  card: {
    marginBottom: 16,
    elevation: 1,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  studentId: {
    color: '#6B7280',
  },
  currentBeltBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  beltBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 80,
    alignItems: 'center',
  },
  beltText: {
    fontWeight: 'bold',
  },
  label: {
    marginBottom: 8,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#D97706',
    flex: 1,
  },
  beltPreview: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  beltTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  previewText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
  },
  submitButton: {
    marginTop: 8,
  },
})

