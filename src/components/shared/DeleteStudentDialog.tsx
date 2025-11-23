import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Dialog, Text, Button, Portal, RadioButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface DeleteStudentDialogProps {
  visible: boolean
  studentName: string
  onConfirm: (hardDelete: boolean) => void
  onCancel: () => void
  loading?: boolean
}

export function DeleteStudentDialog({
  visible,
  studentName,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteStudentDialogProps) {
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')

  const handleConfirm = () => {
    onConfirm(deleteType === 'hard')
    // Reset to soft delete for next time
    setDeleteType('soft')
  }

  const handleCancel = () => {
    onCancel()
    // Reset to soft delete
    setDeleteType('soft')
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>Delete Student</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.message}>
            Are you sure you want to delete <Text style={styles.bold}>{studentName}</Text>?
          </Text>

          <View style={styles.optionsContainer}>
            <Text variant="labelLarge" style={styles.optionsTitle}>
              Select Delete Type:
            </Text>

            {/* Soft Delete Option */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => setDeleteType('soft')}
              disabled={loading}
            >
              <RadioButton
                value="soft"
                status={deleteType === 'soft' ? 'checked' : 'unchecked'}
                onPress={() => setDeleteType('soft')}
                disabled={loading}
              />
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text variant="titleSmall" style={styles.optionTitle}>
                    Soft Delete (Deactivate)
                  </Text>
                  <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
                </View>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Sets student to inactive. All data is preserved and can be reactivated later.
                  Recommended for temporary removals.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Hard Delete Option */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => setDeleteType('hard')}
              disabled={loading}
            >
              <RadioButton
                value="hard"
                status={deleteType === 'hard' ? 'checked' : 'unchecked'}
                onPress={() => setDeleteType('hard')}
                disabled={loading}
              />
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text variant="titleSmall" style={[styles.optionTitle, styles.dangerText]}>
                    Hard Delete (Permanent)
                  </Text>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                </View>
                <Text variant="bodySmall" style={[styles.optionDescription, styles.dangerText]}>
                  Permanently removes student, auth account, and all associated files. This action
                  cannot be undone.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onPress={handleConfirm}
            mode="contained"
            loading={loading}
            disabled={loading}
            buttonColor={deleteType === 'hard' ? '#EF4444' : '#7B2CBF'}
            textColor="#fff"
          >
            {deleteType === 'hard' ? 'Delete Permanently' : 'Deactivate'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
    maxWidth: 500,
  },
  title: {
    fontWeight: '700',
  },
  message: {
    marginBottom: 16,
    color: '#374151',
  },
  bold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionsTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  optionContent: {
    flex: 1,
    marginLeft: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionTitle: {
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  optionDescription: {
    color: '#6B7280',
    lineHeight: 18,
  },
  dangerText: {
    color: '#EF4444',
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
})

