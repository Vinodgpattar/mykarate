import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Modal, Portal } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAllFeeConfigurations } from '@/lib/fees'
import { useState, useEffect } from 'react'
import type { FeeConfiguration } from '@/lib/fees'
import { logger } from '@/lib/logger'

interface MembershipBottomSheetProps {
  visible: boolean
  onClose: () => void
}

export function MembershipBottomSheet({ visible, onClose }: MembershipBottomSheetProps) {
  const insets = useSafeAreaInsets()
  const [fees, setFees] = useState<FeeConfiguration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (visible) {
      loadFees()
    }
  }, [visible])

  const loadFees = async () => {
    try {
      setLoading(true)
      const result = await getAllFeeConfigurations()
      if (!result.error && result.fees) {
        setFees(result.fees)
      }
    } catch (error) {
      logger.error('Error loading fees', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const admissionFee = fees.find(f => f.fee_type === 'registration')
  const monthlyFee = fees.find(f => f.fee_type === 'monthly')
  const yearlyFee = fees.find(f => f.fee_type === 'yearly')
  const gradingFees = fees.filter(f => f.fee_type === 'grading').sort((a, b) => {
    // Sort by belt level order
    const beltOrder = ['Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown 3', 'Brown 2', 'Brown 1', 'Black']
    const aIndex = beltOrder.indexOf(a.belt_level || '')
    const bIndex = beltOrder.indexOf(b.belt_level || '')
    return aIndex - bIndex
  })

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modal,
          { maxHeight: '80%', paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.container}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              Membership & Fees
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text variant="bodyMedium" style={styles.loadingText}>
                  Loading fees...
                </Text>
              </View>
            ) : (
              <>
                {/* Admission Fee */}
                {admissionFee && (
                  <View style={styles.feeSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Admission Fees
                    </Text>
                    <View style={styles.feeCard}>
                      <Text variant="bodyLarge" style={styles.feeLabel}>
                        Admission + Dress
                      </Text>
                      <Text variant="headlineSmall" style={styles.feeAmount}>
                        ₹{admissionFee.amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Monthly Fee */}
                {monthlyFee && (
                  <View style={styles.feeSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Monthly Fees
                    </Text>
                    <View style={styles.feeCard}>
                      <Text variant="bodyLarge" style={styles.feeLabel}>
                        Monthly Fee
                      </Text>
                      <Text variant="headlineSmall" style={styles.feeAmount}>
                        ₹{monthlyFee.amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Yearly Fee */}
                {yearlyFee && (
                  <View style={styles.feeSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Yearly Fees
                    </Text>
                    <View style={styles.feeCard}>
                      <Text variant="bodyLarge" style={styles.feeLabel}>
                        Yearly Fee
                      </Text>
                      <Text variant="headlineSmall" style={styles.feeAmount}>
                        ₹{yearlyFee.amount.toLocaleString()}
                      </Text>
                      <Text variant="bodySmall" style={styles.feeNote}>
                        Save ₹{(monthlyFee ? monthlyFee.amount * 12 - yearlyFee.amount : 0).toLocaleString()} compared to monthly
                      </Text>
                    </View>
                  </View>
                )}

                {/* Grading Fees */}
                {gradingFees.length > 0 && (
                  <View style={styles.feeSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Grading Fees (by Belt Level)
                    </Text>
                    {gradingFees.map((fee) => (
                      <View key={fee.id} style={styles.gradingFeeCard}>
                        <Text variant="bodyLarge" style={styles.feeLabel}>
                          {fee.belt_level || 'Grading'}
                        </Text>
                        <Text variant="titleLarge" style={styles.feeAmount}>
                          ₹{fee.amount.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Note */}
                <View style={styles.noteContainer}>
                  <MaterialCommunityIcons name="information" size={20} color="#6B7280" />
                  <Text variant="bodySmall" style={styles.note}>
                    Fees are subject to change. Please contact us for the most current pricing.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    margin: 0,
  },
  container: {
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
  },
  feeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  feeCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feeLabel: {
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 8,
  },
  feeAmount: {
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  feeNote: {
    color: '#10B981',
    marginTop: 8,
    fontStyle: 'italic',
  },
  gradingFeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  note: {
    flex: 1,
    marginLeft: 8,
    color: '#92400E',
    lineHeight: 18,
  },
})

