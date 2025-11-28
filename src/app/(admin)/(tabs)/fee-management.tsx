import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Text, Card, Button, ActivityIndicator, Dialog, TextInput, Snackbar } from 'react-native-paper'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getAllFeeConfigurations, setFeeConfiguration, type FeeConfiguration, type FeeType } from '@/lib/fees'
import { logger } from '@/lib/logger'
import { AdminHeader } from '@/components/admin/AdminHeader'

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  registration: 'Registration Fee',
  monthly: 'Monthly Fee',
  yearly: 'Yearly Fee',
  grading: 'Grading Fee',
}

// Belt levels for grading fees (as specified by user)
const BELT_LEVELS = ['Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown 3', 'Brown 2', 'Brown 1', 'Black']

export default function FeeManagementScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [fees, setFees] = useState<FeeConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Edit dialog state
  const [editDialogVisible, setEditDialogVisible] = useState(false)
  const [editingFee, setEditingFee] = useState<{ feeType: FeeType; beltLevel: string | null; currentAmount: number } | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  // Refs to prevent unnecessary reloads
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return
      
      // Skip if just loaded or currently loading
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
      if (isLoadingRef.current || timeSinceLastLoad < 1000) {
        return
      }

      // Reload data
      isLoadingRef.current = true
      loadData().finally(() => {
        isLoadingRef.current = false
        lastLoadTimeRef.current = Date.now()
      })
    }, [user])
  )

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getAllFeeConfigurations()

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      setFees(result.fees || [])
    } catch (error) {
      logger.error('Error loading fees', error as Error)
      setSnackbar({ visible: true, message: 'Failed to load fees' })
    } finally {
      setLoading(false)
      setRefreshing(false)
      lastLoadTimeRef.current = Date.now()
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const openEditDialog = (feeType: FeeType, beltLevel: string | null, currentAmount: number) => {
    setEditingFee({ feeType, beltLevel, currentAmount })
    setEditAmount(currentAmount.toString())
    setEditDialogVisible(true)
  }

  const handleSaveFee = async () => {
    if (!editingFee || !user?.id) return

    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount < 0) {
      setSnackbar({ visible: true, message: 'Please enter a valid amount' })
      return
    }

    try {
      setSaving(true)
      const result = await setFeeConfiguration(editingFee.feeType, amount, editingFee.beltLevel, user.id)

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      setEditDialogVisible(false)
      setEditingFee(null)
      setEditAmount('')
      setSnackbar({ visible: true, message: 'Fee updated successfully' })
      await loadData()
    } catch (error) {
      logger.error('Error saving fee', error as Error)
      setSnackbar({ visible: true, message: 'Failed to save fee' })
    } finally {
      setSaving(false)
    }
  }

  const getFeeForType = (feeType: FeeType, beltLevel: string | null = null) => {
    if (feeType === 'grading' && beltLevel) {
      return fees.find((f) => f.fee_type === feeType && f.belt_level === beltLevel)
    } else if (feeType !== 'grading') {
      return fees.find((f) => f.fee_type === feeType && f.belt_level === null)
    }
    return null
  }

  const renderFeeCard = (feeType: FeeType, beltLevel: string | null = null) => {
    const fee = getFeeForType(feeType, beltLevel)
    const amount = fee?.amount || 0
    const label = beltLevel ? `${FEE_TYPE_LABELS[feeType]} - ${beltLevel}` : FEE_TYPE_LABELS[feeType]

    return (
      <Card key={`${feeType}-${beltLevel || 'global'}`} style={styles.feeCard}>
        <Card.Content>
          <View style={styles.feeHeader}>
            <View style={styles.feeInfo}>
              <Text variant="titleMedium" style={styles.feeTypeLabel}>
                {label}
              </Text>
              <Text variant="bodySmall" style={styles.feeSubtext}>
                {beltLevel ? `Belt Level: ${beltLevel}` : 'Global Fee'}
              </Text>
            </View>
            <View style={styles.feeAmountContainer}>
              <Text variant="headlineSmall" style={styles.feeAmount}>
                ₹{amount.toFixed(2)}
              </Text>
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={() => openEditDialog(feeType, beltLevel, amount)}
            style={styles.editButton}
            icon="pencil"
          >
            Edit
          </Button>
        </Card.Content>
      </Card>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Fee Management
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Fee Management"
        subtitle="Configure global fees and belt-specific grading fees"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Global Fees */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Global Fees
          </Text>
          {(['registration', 'monthly', 'yearly'] as FeeType[]).map((feeType) => renderFeeCard(feeType))}
        </View>

        {/* Belt-Specific Grading Fees */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Grading Fees (by Belt Level)
          </Text>
          {BELT_LEVELS.map((beltLevel) => renderFeeCard('grading', beltLevel))}
        </View>
      </ScrollView>

      {/* Edit Dialog */}
      <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
        <Dialog.Title>Edit Fee</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.dialogLabel}>
            {editingFee && (
              editingFee.beltLevel
                ? `${FEE_TYPE_LABELS[editingFee.feeType]} - ${editingFee.beltLevel}`
                : FEE_TYPE_LABELS[editingFee.feeType]
            )}
          </Text>
          <TextInput
            label="Amount (₹)"
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="decimal-pad"
            mode="outlined"
            style={styles.dialogInput}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setEditDialogVisible(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onPress={handleSaveFee} loading={saving} mode="contained" buttonColor="#7B2CBF">
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>

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
    backgroundColor: '#FFF8E7',
  },
  header: {
    padding: 16,
    paddingTop: 16,
    backgroundColor: '#FFF8E7',
  },
  title: {
    fontWeight: '600',
    color: '#1A1A1A',
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
    paddingVertical: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  feeCard: {
    marginBottom: 12,
    elevation: 1,
    backgroundColor: '#FFFFFF',
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeTypeLabel: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  feeSubtext: {
    color: '#6B7280',
  },
  feeAmountContainer: {
    alignItems: 'flex-end',
  },
  feeAmount: {
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  editButton: {
    marginTop: 8,
  },
  dialogLabel: {
    marginBottom: 8,
    color: '#1A1A1A',
  },
  dialogInput: {
    marginBottom: 8,
  },
})
