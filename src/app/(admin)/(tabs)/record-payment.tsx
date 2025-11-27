import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, Card, Button, TextInput, ActivityIndicator, Snackbar, Menu } from 'react-native-paper'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getAllFees, recordPayment, type StudentFee } from '@/lib/fees'
import { logger } from '@/lib/logger'
import { AdminHeader } from '@/components/admin/AdminHeader'

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'online', 'other']

export default function RecordPaymentScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const feeId = params.id as string

  const [fee, setFee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [methodMenuVisible, setMethodMenuVisible] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  
  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  // Load fee when screen comes into focus or feeId changes
  useFocusEffect(
    useCallback(() => {
      if (feeId) {
        // Skip if just loaded or currently loading
        const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
        if (isLoadingRef.current || timeSinceLastLoad < 500) {
          return
        }

        // Clear form when screen comes into focus
        setPaymentAmount('')
        setReceiptNumber('')
        setNotes('')
        setPaymentMethod('cash')
        
        // Reload fee data
        isLoadingRef.current = true
        loadFee().finally(() => {
          isLoadingRef.current = false
          lastLoadTimeRef.current = Date.now()
        })
      }
    }, [feeId])
  )

  const loadFee = async () => {
    try {
      setLoading(true)
      // Fetch fresh fee data
      const result = await getAllFees({ studentId: undefined })

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        router.back()
        return
      }

      const foundFee = result.fees?.find((f: any) => f.id === feeId)
      if (!foundFee) {
        setSnackbar({ visible: true, message: 'Fee not found' })
        router.back()
        return
      }

      // Ensure paid_amount is a number, not null/undefined
      const paidAmount = typeof foundFee.paid_amount === 'number' ? foundFee.paid_amount : 0
      const totalAmount = typeof foundFee.amount === 'number' ? foundFee.amount : 0
      const remainingAmount = totalAmount - paidAmount

      // Update fee with normalized paid_amount
      setFee({
        ...foundFee,
        paid_amount: paidAmount,
        amount: totalAmount,
      })
      
      // Auto-fill remaining amount (user can change it)
      setPaymentAmount(remainingAmount > 0 ? remainingAmount.toFixed(2) : '')
    } catch (error) {
      logger.error('Error loading fee', error as Error)
      setSnackbar({ visible: true, message: 'Failed to load fee' })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user?.id || !fee) return

    // Validate payment amount
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({ visible: true, message: 'Please enter a valid payment amount' })
      return
    }

    // Calculate remaining amount from current fee data
    const paidAmount = typeof fee.paid_amount === 'number' ? fee.paid_amount : 0
    const totalAmount = typeof fee.amount === 'number' ? fee.amount : 0
    const remainingAmount = totalAmount - paidAmount

    if (amount > remainingAmount) {
      setSnackbar({ visible: true, message: `Payment amount cannot exceed remaining balance of ₹${remainingAmount.toFixed(2)}` })
      return
    }

    try {
      setSaving(true)
      const result = await recordPayment(feeId, {
        amount,
        paymentMethod,
        receiptNumber: receiptNumber.trim() || null,
        notes: notes.trim() || null,
        recordedById: user.id,
      })

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      // Get student_id before refreshing (fee object will be updated)
      const studentId = fee?.student_id

      // Refresh fee data after successful payment to get updated balance
      await loadFee()

      setSnackbar({ visible: true, message: 'Payment recorded successfully' })
      
      // Navigate back to student profile (where user came from)
      // Always navigate to student profile if we have student_id
      setTimeout(() => {
        if (studentId) {
          router.push(`/(admin)/(tabs)/student-profile?id=${studentId}`)
        } else {
          router.back()
        }
      }, 1500)
    } catch (error) {
      logger.error('Error recording payment', error as Error)
      setSnackbar({ visible: true, message: 'Failed to record payment' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
          <Text style={styles.loadingText}>Loading fee details...</Text>
        </View>
      </View>
    )
  }

  if (!fee) {
    return null
  }

  // Calculate remaining amount with proper null handling
  const paidAmount = typeof fee.paid_amount === 'number' ? fee.paid_amount : 0
  const totalAmount = typeof fee.amount === 'number' ? fee.amount : 0
  const remainingAmount = totalAmount - paidAmount
  const studentName = fee.student
    ? `${fee.student.first_name} ${fee.student.last_name}`
    : 'Unknown Student'

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <AdminHeader title="Record Payment" showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Fee Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Fee Details
            </Text>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Student:
              </Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {studentName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Fee Type:
              </Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {fee.fee_type.charAt(0).toUpperCase() + fee.fee_type.slice(1)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Total Amount:
              </Text>
              <Text variant="bodyMedium" style={styles.detailAmount}>
                ₹{fee.amount.toFixed(2)}
              </Text>
            </View>
            {fee.paid_amount > 0 && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>
                  Paid Amount:
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  ₹{fee.paid_amount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Remaining:
              </Text>
              <Text variant="bodyMedium" style={[styles.detailAmount, { color: remainingAmount > 0 ? '#DC2626' : '#10B981' }]}>
                ₹{remainingAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Due Date:
              </Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {fee.due_date ? new Date(fee.due_date).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </Text>
            </View>
            {fee.period_start_date && fee.period_end_date && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>
                  Period:
                </Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {new Date(fee.period_start_date).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric'
                  })} - {new Date(fee.period_end_date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Payment Form Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Payment Information
            </Text>

            <TextInput
              label="Payment Amount (₹) *"
              value={paymentAmount}
              onChangeText={(text) => {
                // Only allow numbers and one decimal point
                const cleaned = text.replace(/[^0-9.]/g, '')
                // Ensure only one decimal point
                const parts = cleaned.split('.')
                if (parts.length > 2) {
                  setPaymentAmount(parts[0] + '.' + parts.slice(1).join(''))
                } else {
                  setPaymentAmount(cleaned)
                }
              }}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              disabled={saving || remainingAmount <= 0}
              helperText={remainingAmount > 0 ? `Remaining balance: ₹${remainingAmount.toFixed(2)}` : 'Fee is fully paid'}
              error={
                paymentAmount && 
                (isNaN(parseFloat(paymentAmount)) || 
                 parseFloat(paymentAmount) <= 0 || 
                 parseFloat(paymentAmount) > remainingAmount)
              }
            />

            <Menu
              visible={methodMenuVisible}
              onDismiss={() => setMethodMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (methodMenuVisible) {
                      setMethodMenuVisible(false)
                    } else {
                      setTimeout(() => setMethodMenuVisible(true), 50)
                    }
                  }}
                  style={styles.input}
                  icon="cash-multiple"
                >
                  Payment Method: {paymentMethod.replace('_', ' ').toUpperCase()}
                </Button>
              }
            >
              {PAYMENT_METHODS.map((method) => (
                <Menu.Item
                  key={method}
                  onPress={() => {
                    setPaymentMethod(method)
                    setMethodMenuVisible(false)
                  }}
                  title={method.replace('_', ' ').toUpperCase()}
                />
              ))}
            </Menu>

            <TextInput
              label="Receipt Number (optional)"
              value={receiptNumber}
              onChangeText={setReceiptNumber}
              mode="outlined"
              style={styles.input}
              disabled={saving}
            />

            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              disabled={saving}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving || remainingAmount <= 0}
              style={styles.submitButton}
              buttonColor="#7B2CBF"
              icon="cash-check"
            >
              Record Payment
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#6B7280',
  },
  detailValue: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  detailAmount: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
})

