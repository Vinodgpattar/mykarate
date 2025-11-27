import { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Snackbar,
  Avatar,
  Chip,
  Portal,
  Dialog,
  RadioButton,
  TextInput,
} from 'react-native-paper'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getStudentById, deleteStudent, reactivateStudent, type StudentWithBranch } from '@/lib/students'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  getStudentFees,
  getStudentPaymentPreference,
  switchPaymentPreference,
  type StudentFee,
  type FeeStatus,
  type PaymentPreference,
  type PaymentType,
} from '@/lib/fees'
import { DeleteStudentDialog } from '@/components/shared/DeleteStudentDialog'
import { DatePicker } from '@/components/shared/DatePicker'
import { useAuth } from '@/context/AuthContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import ImageViewing from 'react-native-image-viewing'
import { BELT_COLORS, getBeltDisplayName } from '@/lib/belts'

export default function StudentProfileScreen() {
  // Feature flag: Set to true to enable switch plan feature
  const ENABLE_SWITCH_PLAN = false

  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const studentId = params.id as string

  const [student, setStudent] = useState<StudentWithBranch | null>(null)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [imageViewerVisible, setImageViewerVisible] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [fees, setFees] = useState<StudentFee[]>([])
  const [loadingFees, setLoadingFees] = useState(false)
  const [paymentPreference, setPaymentPreference] = useState<PaymentPreference | null>(null)
  const [loadingPreference, setLoadingPreference] = useState(false)
  const [switchDialogVisible, setSwitchDialogVisible] = useState(false)
  const [switchPaymentType, setSwitchPaymentType] = useState<PaymentType>('monthly')
  const [switchDate, setSwitchDate] = useState(() => new Date().toISOString().split('T')[0])
  const [switchingPreference, setSwitchingPreference] = useState(false)

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    if (studentId) {
      loadStudent()
    }
  }, [studentId])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!studentId) return
      
      // Skip if just loaded or currently loading
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
      if (isLoadingRef.current || timeSinceLastLoad < 1000) {
        return
      }

      // Reload data
      isLoadingRef.current = true
      loadStudent().finally(() => {
        isLoadingRef.current = false
        lastLoadTimeRef.current = Date.now()
      })
    }, [studentId])
  )

  const loadStudent = async () => {
    try {
      setLoading(true)
      const result = await getStudentById(studentId)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        router.back()
      } else if (result.student) {
        setStudent(result.student)
        // Load fees for this student
        loadFees()
        loadPaymentPreference()
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to load student' })
      router.back()
    } finally {
      setLoading(false)
      lastLoadTimeRef.current = Date.now()
    }
  }

  const loadPaymentPreference = async () => {
    if (!studentId) return
    try {
      setLoadingPreference(true)
      const result = await getStudentPaymentPreference(studentId)
      if (result.error) {
        console.warn('Failed to load payment preference:', result.error.message)
        setPaymentPreference(null)
      } else {
        setPaymentPreference(result.preference)
      }
    } catch (error) {
      console.warn('Error loading payment preference:', error)
      setPaymentPreference(null)
    } finally {
      setLoadingPreference(false)
    }
  }

  const loadFees = async () => {
    if (!studentId) return
    try {
      setLoadingFees(true)
      const result = await getStudentFees(studentId)
      if (result.error) {
        // Don't show error for fees - just log it
        console.warn('Failed to load fees:', result.error.message)
      } else {
        setFees(result.fees || [])
      }
    } catch (error) {
      console.warn('Error loading fees:', error)
    } finally {
      setLoadingFees(false)
    }
  }

  const handleDeleteClick = () => {
    if (!student) return
    setDeleteDialogVisible(true)
  }

  const handleDeleteConfirm = async (hardDelete: boolean) => {
    if (!student || !user?.id) return

    setDeleting(true)
    try {
      const result = await deleteStudent(student.id, hardDelete, user.id)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        setSnackbar({
          visible: true,
          message: hardDelete
            ? 'Student permanently deleted'
            : 'Student deactivated successfully',
        })
        setDeleteDialogVisible(false)
        router.back()
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to delete student' })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false)
  }

  const handleReactivate = async () => {
    if (!student || !user?.id) return

    setReactivating(true)
    try {
      const result = await reactivateStudent(student.id, user.id)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        setSnackbar({ visible: true, message: 'Student reactivated successfully' })
        loadStudent() // Reload to update the UI
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to reactivate student' })
    } finally {
      setReactivating(false)
    }
  }

  const handleViewImage = (imageUrl: string) => {
    if (!imageUrl) return
    setViewingImage(imageUrl)
    setImageViewerVisible(true)
  }

  const handleOpenSwitchDialog = () => {
    if (paymentPreference) {
      setSwitchPaymentType(paymentPreference.payment_type === 'monthly' ? 'yearly' : 'monthly')
    } else {
      setSwitchPaymentType('monthly')
    }
    setSwitchDate(new Date().toISOString().split('T')[0])
    setSwitchDialogVisible(true)
  }

  const handleSwitchPreference = async () => {
    if (!studentId) return
    try {
      setSwitchingPreference(true)
      const result = await switchPaymentPreference(studentId, switchPaymentType, switchDate)
      if (!result.success) {
        setSnackbar({
          visible: true,
          message: result.error?.message || 'Failed to switch payment preference',
        })
        return
      }

      setSnackbar({
        visible: true,
        message: `Payment plan switched to ${switchPaymentType === 'monthly' ? 'Monthly' : 'Yearly'}`,
      })
      setSwitchDialogVisible(false)
      await Promise.all([loadPaymentPreference(), loadFees()])
    } catch (error) {
      setSnackbar({
        visible: true,
        message: error instanceof Error ? error.message : 'Failed to switch payment preference',
      })
    } finally {
      setSwitchingPreference(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading student...</Text>
      </View>
    )
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#F59E0B" />
        <Text style={styles.loadingText}>Student not found</Text>
        <Button onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    )
  }

  const profileCompletion = calculateProfileCompletion(student)

  return (
    <View style={styles.container}>
      <AdminHeader title="Student Profile" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Profile Header Card */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              {student.student_photo_url ? (
                <Image source={{ uri: student.student_photo_url }} style={styles.profilePhoto} />
              ) : (
                <Avatar.Text
                  size={80}
                  label={`${student.first_name[0]}${student.last_name[0]}`}
                  style={styles.avatar}
                />
              )}
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.profileName}>
                  {student.first_name} {student.last_name}
                </Text>
                <Text variant="bodyMedium" style={styles.studentId}>
                  {student.student_id}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.beltBadge,
                      { backgroundColor: BELT_COLORS[student.current_belt] || '#E5E7EB' },
                    ]}
                  >
                    <Text
                      variant="labelMedium"
                      style={[
                        styles.beltText,
                        { color: student.current_belt === 'White' || student.current_belt === 'Yellow' ? '#000' : '#FFF' },
                      ]}
                    >
                      {getBeltDisplayName(student.current_belt)}
                    </Text>
                  </View>
                  {student.is_active ? (
                    <View style={[styles.statusBadge, styles.activeBadge]}>
                      <MaterialCommunityIcons name="check-circle" size={12} color="#065F46" style={styles.statusIcon} />
                      <Text variant="labelSmall" style={styles.activeText}>
                        Active
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.inactiveBadge]}>
                      <MaterialCommunityIcons name="close-circle" size={12} color="#D97706" style={styles.statusIcon} />
                      <Text variant="labelSmall" style={styles.inactiveText}>
                        Inactive
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Profile Completion */}
            {!student.profile_completed && (
              <View style={styles.completionCard}>
                <View style={styles.completionHeader}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" />
                  <Text variant="titleSmall" style={styles.completionTitle}>
                    Profile Incomplete ({profileCompletion}%)
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.completionText}>
                  Student needs to complete their profile
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Personal Information
              </Text>
            </View>
            <InfoRow icon="email" label="Email" value={student.email} />
            {student.phone && <InfoRow icon="phone" label="Phone" value={student.phone} />}
            {student.date_of_birth && (
              <InfoRow
                icon="calendar"
                label="Date of Birth"
                value={format(new Date(student.date_of_birth), 'MMM dd, yyyy')}
              />
            )}
            {student.gender && <InfoRow icon="gender-male-female" label="Gender" value={student.gender} />}
            {student.address && <InfoRow icon="map-marker" label="Address" value={student.address} />}
            {student.aadhar_number && (
              <InfoRow icon="card-account-details" label="Aadhar Number" value={student.aadhar_number} />
            )}
          </Card.Content>
        </Card>

        {/* Branch Information */}
        {student.branch && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="office-building" size={24} color="#6366F1" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Branch Information
                </Text>
              </View>
              <InfoRow icon="office-building" label="Branch" value={student.branch.name} />
              {student.branch.code && (
                <InfoRow icon="tag" label="Branch Code" value={student.branch.code} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Parent/Guardian Information */}
        {(student.parent_name || student.parent_email || student.parent_phone) && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-group" size={24} color="#7B2CBF" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Parent/Guardian
                </Text>
              </View>
              {student.parent_name && <InfoRow icon="account" label="Name" value={student.parent_name} />}
              {student.parent_email && <InfoRow icon="email" label="Email" value={student.parent_email} />}
              {student.parent_phone && <InfoRow icon="phone" label="Phone" value={student.parent_phone} />}
              {student.parent_relation && (
                <InfoRow icon="relation-many-to-many" label="Relation" value={student.parent_relation} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Emergency Contact */}
        {(student.emergency_contact_name || student.emergency_contact_phone) && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="phone-alert" size={24} color="#F59E0B" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Emergency Contact
                </Text>
              </View>
              {student.emergency_contact_name && (
                <InfoRow icon="account" label="Name" value={student.emergency_contact_name} />
              )}
              {student.emergency_contact_phone && (
                <InfoRow icon="phone" label="Phone" value={student.emergency_contact_phone} />
              )}
              {student.emergency_contact_relation && (
                <InfoRow icon="relation-many-to-many" label="Relation" value={student.emergency_contact_relation} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Medical Information */}
        {student.medical_conditions && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="medical-bag" size={24} color="#EF4444" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Medical Information
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.medicalText}>
                {student.medical_conditions}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Documents */}
        {(student.student_photo_url || student.aadhar_card_url) && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="file-document" size={24} color="#6366F1" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Documents
                </Text>
              </View>
              {student.student_photo_url && (
                <View style={styles.documentRow}>
                  <MaterialCommunityIcons name="image" size={20} color="#6B7280" />
                  <Text variant="bodyMedium" style={styles.documentLabel}>
                    Student Photo
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleViewImage(student.student_photo_url)}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={20} color="#7B2CBF" />
                  </TouchableOpacity>
                </View>
              )}
              {student.aadhar_card_url && (
                <View style={styles.documentRow}>
                  <MaterialCommunityIcons name="card-account-details" size={20} color="#6B7280" />
                  <Text variant="bodyMedium" style={styles.documentLabel}>
                    Aadhar Card
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleViewImage(student.aadhar_card_url)}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={20} color="#7B2CBF" />
                  </TouchableOpacity>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        {student.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="note-text" size={24} color="#6366F1" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Notes
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.notesText}>
                {student.notes}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Fees Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#10B981" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Fees
              </Text>
              <View style={{ flex: 1 }} />
              <Button
                mode="text"
                compact
                onPress={() => router.push(`/(admin)/(tabs)/student-fees?studentId=${student.id}`)}
                textColor="#7B2CBF"
              >
                View All
              </Button>
            </View>

            <View style={styles.paymentPlanCard}>
              <View style={styles.paymentPlanHeader}>
                <View style={styles.paymentPlanTextContainer}>
                  <Text variant="titleSmall" style={styles.paymentPlanLabel}>
                    Payment Plan
                  </Text>
                  <Text variant="bodySmall" style={styles.paymentPlanHint}>
                    Controls whether this student is billed monthly or yearly
                  </Text>
                </View>
                {ENABLE_SWITCH_PLAN && (
                  <Button
                    mode="outlined"
                    compact
                    onPress={handleOpenSwitchDialog}
                    disabled={loadingPreference || switchingPreference || !student.is_active}
                    textColor="#7B2CBF"
                    style={styles.switchPlanButton}
                  >
                    Switch Plan
                  </Button>
                )}
              </View>

              {loadingPreference ? (
                <View style={styles.paymentPlanLoading}>
                  <ActivityIndicator size="small" color="#7B2CBF" />
                  <Text variant="bodySmall" style={styles.paymentPlanLoadingText}>
                    Loading payment preference...
                  </Text>
                </View>
              ) : paymentPreference ? (
                <View style={styles.paymentPlanDetails}>
                  <Chip
                    icon={paymentPreference.payment_type === 'monthly' ? 'calendar-month' : 'calendar-multiselect'}
                    style={[
                      styles.paymentPlanChip,
                      paymentPreference.payment_type === 'monthly'
                        ? styles.monthlyChip
                        : styles.yearlyChip,
                    ]}
                    textStyle={styles.paymentPlanChipText}
                  >
                    {paymentPreference.payment_type === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'}
                  </Chip>
                  <Text variant="bodySmall" style={styles.paymentPlanMeta}>
                    Effective since{' '}
                    {paymentPreference.started_from
                      ? format(new Date(paymentPreference.started_from), 'MMM dd, yyyy')
                      : 'N/A'}
                  </Text>
                  <Text variant="bodySmall" style={styles.paymentPlanNote}>
                    Pending fees from the previous plan stay due. New fees follow the selected plan.
                  </Text>
                </View>
              ) : (
                <View style={styles.paymentPlanDetails}>
                  <Text variant="bodyMedium" style={styles.paymentPlanEmpty}>
                    No payment plan found. The next fee generation will set one automatically.
                  </Text>
                </View>
              )}
            </View>

            {loadingFees ? (
              <View style={styles.feesLoading}>
                <ActivityIndicator size="small" color="#7B2CBF" />
                <Text variant="bodySmall" style={styles.feesLoadingText}>
                  Loading fees...
                </Text>
              </View>
            ) : fees.length === 0 ? (
              <View style={styles.emptyFees}>
                <MaterialCommunityIcons name="cash-off" size={32} color="#9CA3AF" />
                <Text variant="bodyMedium" style={styles.emptyFeesText}>
                  No fees found
                </Text>
              </View>
            ) : (
              <>
                {/* Fee Stats */}
                <View style={styles.feeStats}>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statValue}>
                      {fees.filter((f) => f.status === 'pending').length}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Pending
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={[styles.statValue, { color: '#DC2626' }]}>
                      {fees.filter((f) => f.status === 'overdue').length}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Overdue
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={[styles.statValue, { color: '#10B981' }]}>
                      {fees.filter((f) => f.status === 'paid').length}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Paid
                    </Text>
                  </View>
                </View>

                {/* Recent Fees List (Last 5) */}
                <View style={styles.feesList}>
                  {fees.slice(0, 5).map((fee) => {
                    const remainingAmount = fee.amount - (fee.paid_amount || 0)
                    const feeTypeLabels: Record<string, string> = {
                      registration: 'Registration',
                      monthly: 'Monthly',
                      yearly: 'Yearly',
                      grading: 'Grading',
                    }
                    const statusColors: Record<FeeStatus, string> = {
                      pending: '#F59E0B',
                      paid: '#10B981',
                      overdue: '#DC2626',
                    }

                    return (
                      <TouchableOpacity
                        key={fee.id}
                        onPress={() => {
                          if (fee.status === 'pending' || fee.status === 'overdue') {
                            router.push(`/(admin)/(tabs)/record-payment?id=${fee.id}`)
                          }
                        }}
                        style={styles.feeRow}
                      >
                        <View style={styles.feeRowContent}>
                          <View style={styles.feeInfo}>
                            <Text variant="bodyMedium" style={styles.feeType}>
                              {feeTypeLabels[fee.fee_type] || fee.fee_type}
                            </Text>
                            <Text variant="bodySmall" style={styles.feeDate}>
                              Due: {format(new Date(fee.due_date), 'MMM dd, yyyy')}
                            </Text>
                          </View>
                          <View style={styles.feeAmountContainer}>
                            <View style={styles.feeAmountRow}>
                              <Text variant="bodyMedium" style={styles.feeAmount}>
                                ₹{fee.amount.toFixed(2)}
                              </Text>
                              {fee.paid_amount > 0 && (
                                <Text variant="bodySmall" style={styles.feePaidAmount}>
                                  Paid: ₹{fee.paid_amount.toFixed(2)}
                                </Text>
                              )}
                              {remainingAmount > 0 && (
                                <Text variant="bodySmall" style={styles.feeRemainingAmount}>
                                  Remaining: ₹{remainingAmount.toFixed(2)}
                                </Text>
                              )}
                            </View>
                            {fee.status === 'pending' || fee.status === 'overdue' ? (
                              <View style={[styles.feeStatusBadge, { backgroundColor: statusColors[fee.status] }]}>
                                <Text variant="labelSmall" style={styles.feeStatusText}>
                                  {fee.status === 'overdue' ? 'Overdue' : remainingAmount > 0 ? 'Pending' : 'Paid'}
                                </Text>
                              </View>
                            ) : (
                              <View style={[styles.feeStatusBadge, { backgroundColor: statusColors[fee.status] }]}>
                                <Text variant="labelSmall" style={styles.feeStatusText}>
                                  Paid
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {(fee.status === 'pending' || fee.status === 'overdue') && remainingAmount > 0 && (
                          <Button
                            mode="contained"
                            compact
                            onPress={() => router.push(`/(admin)/(tabs)/record-payment?id=${fee.id}`)}
                            style={styles.recordPaymentButton}
                            buttonColor="#7B2CBF"
                            icon="cash-check"
                          >
                            Record Payment
                          </Button>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.push(`/(admin)/(tabs)/edit-student?id=${student.id}`)}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit Student
          </Button>
          {student.is_active && (
            <Button
              mode="contained"
              onPress={() => router.push(`/(admin)/(tabs)/belt-grading?studentId=${student.id}`)}
              buttonColor="#7B2CBF"
              style={styles.actionButton}
              icon="trophy"
            >
              Record Belt Grading
            </Button>
          )}
          {!student.is_active ? (
            <Button
              mode="contained"
              onPress={handleReactivate}
              disabled={reactivating}
              loading={reactivating}
              buttonColor="#10B981"
              style={styles.actionButton}
              icon="check-circle"
            >
              Reactivate
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleDeleteClick}
              textColor="#EF4444"
              style={styles.actionButton}
              icon="delete"
            >
              Delete
            </Button>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>

      <DeleteStudentDialog
        visible={deleteDialogVisible}
        studentName={student ? `${student.first_name} ${student.last_name}` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />

      {ENABLE_SWITCH_PLAN && (
        <Portal>
          <Dialog visible={switchDialogVisible} onDismiss={() => setSwitchDialogVisible(false)}>
            <Dialog.Title>Switch Payment Plan</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={styles.switchDialogText}>
                {paymentPreference
                  ? `Current plan: ${paymentPreference.payment_type === 'monthly' ? 'Monthly' : 'Yearly'}`
                  : 'No payment preference is currently set.'}
              </Text>
              <RadioButton.Group onValueChange={(value) => setSwitchPaymentType(value as PaymentType)} value={switchPaymentType}>
                <RadioButton.Item label="Monthly" value="monthly" />
                <RadioButton.Item label="Yearly" value="yearly" />
              </RadioButton.Group>
              <DatePicker
                label="Switch Date"
                value={switchDate}
                onChange={setSwitchDate}
                placeholder="Select switch date"
                style={styles.switchDateInput}
              />
              <Text variant="bodySmall" style={styles.switchDialogHint}>
                Existing pending fees stay due. New fees after the switch date will use the selected plan.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setSwitchDialogVisible(false)}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleSwitchPreference}
                loading={switchingPreference}
                disabled={switchingPreference}
              >
                Switch Plan
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}

      <ImageViewing
        images={viewingImage ? [{ uri: viewingImage }] : []}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        presentationStyle="overFullScreen"
      />
    </View>
  )
}

// Info Row Component
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color="#6B7280" />
      <View style={styles.infoContent}>
        <Text variant="bodySmall" style={styles.infoLabel}>
          {label}
        </Text>
        <Text variant="bodyMedium" style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  )
}

// Calculate profile completion percentage
function calculateProfileCompletion(student: StudentWithBranch): number {
  const fields = [
    student.date_of_birth,
    student.gender,
    student.address,
    student.aadhar_number,
    student.student_photo_url,
    student.aadhar_card_url,
    student.parent_name,
    student.emergency_contact_name,
  ]
  const completed = fields.filter(Boolean).length
  return Math.round((completed / fields.length) * 100)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  backButton: {
    marginTop: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatar: {
    backgroundColor: '#F3E8FF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentId: {
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  beltBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  beltText: {
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    marginRight: 0,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEF3C7',
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  completionCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completionTitle: {
    fontWeight: '600',
    color: '#D97706',
  },
  completionText: {
    color: '#92400E',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  paymentPlanCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  paymentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  paymentPlanTextContainer: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  paymentPlanLabel: {
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentPlanHint: {
    color: '#6B7280',
    marginTop: 2,
  },
  switchPlanButton: {
    borderColor: '#7B2CBF',
    flexShrink: 0,
  },
  paymentPlanLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentPlanLoadingText: {
    color: '#6B7280',
  },
  paymentPlanDetails: {
    gap: 8,
  },
  paymentPlanChip: {
    alignSelf: 'flex-start',
  },
  monthlyChip: {
    backgroundColor: '#DBEAFE',
  },
  yearlyChip: {
    backgroundColor: '#FDE68A',
  },
  paymentPlanChipText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentPlanMeta: {
    color: '#4B5563',
  },
  paymentPlanNote: {
    color: '#6B7280',
  },
  paymentPlanEmpty: {
    color: '#6B7280',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    color: '#1F2937',
    fontWeight: '500',
  },
  medicalText: {
    color: '#1F2937',
    lineHeight: 20,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  documentLabel: {
    flex: 1,
    color: '#1F2937',
  },
  switchDialogText: {
    marginBottom: 8,
  },
  switchDialogHint: {
    marginTop: 8,
    color: '#6B7280',
  },
  switchDateInput: {
    marginTop: 8,
  },
  notesText: {
    color: '#1F2937',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
  feesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  feesLoadingText: {
    color: '#6B7280',
  },
  emptyFees: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyFeesText: {
    marginTop: 8,
    color: '#6B7280',
  },
  feeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    color: '#6B7280',
  },
  feesList: {
    marginTop: 8,
  },
  feeRow: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  feeRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  feeInfo: {
    flex: 1,
  },
  feeType: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  feeDate: {
    color: '#6B7280',
  },
  feeAmountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  feeAmountRow: {
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 4,
  },
  feeAmount: {
    fontWeight: '600',
    color: '#7B2CBF',
  },
  feePaidAmount: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
  feeRemainingAmount: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
  feeStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  feeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordPaymentButton: {
    marginTop: 4,
  },
})

