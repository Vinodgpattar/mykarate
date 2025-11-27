import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { TextInput, Button, Modal, Portal, Text } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'
import { format } from 'date-fns'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface DatePickerProps {
  value: string // YYYY-MM-DD format
  onChange: (date: string) => void
  label?: string
  placeholder?: string
  error?: boolean
  disabled?: boolean
  minimumDate?: Date
  maximumDate?: Date
  mode?: 'date' | 'time' | 'datetime'
  style?: any
  outlineStyle?: any
  left?: React.ReactNode
}

export function DatePicker({
  value,
  onChange,
  label = 'Select Date',
  placeholder = 'Select Date',
  error = false,
  disabled = false,
  minimumDate,
  maximumDate,
  mode = 'date',
  style,
  outlineStyle,
  left,
}: DatePickerProps) {
  const [showModal, setShowModal] = useState(false)
  const [tempDate, setTempDate] = useState(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00')
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      }
    }
    const today = new Date()
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    }
  })

  // Update tempDate when value changes externally
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00')
      setTempDate({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      })
    }
  }, [value])

  const minYear = minimumDate ? minimumDate.getFullYear() : 1900
  const maxYear = maximumDate ? maximumDate.getFullYear() : new Date().getFullYear() + 10
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const daysInMonth = new Date(tempDate.year, tempDate.month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Adjust day if it exceeds days in month
  useEffect(() => {
    const daysInNewMonth = new Date(tempDate.year, tempDate.month, 0).getDate()
    if (tempDate.day > daysInNewMonth) {
      setTempDate({ ...tempDate, day: daysInNewMonth })
    }
  }, [tempDate.year, tempDate.month])

  const handleConfirm = () => {
    const dateStr = `${tempDate.year}-${String(tempDate.month).padStart(2, '0')}-${String(tempDate.day).padStart(2, '0')}`
    
    // Validate against min/max dates if provided
    const selectedDate = new Date(dateStr + 'T00:00:00')
    if (minimumDate && selectedDate < minimumDate) {
      return // Don't allow dates before minimum
    }
    if (maximumDate && selectedDate > maximumDate) {
      return // Don't allow dates after maximum
    }
    
    onChange(dateStr)
    setShowModal(false)
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return format(date, 'MMM dd, yyyy')
    } catch {
      return dateStr
    }
  }

  const handlePress = () => {
    if (disabled) return
    setShowModal(true)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <>
      <TextInput
        label={label}
        value={formatDisplayDate(value)}
        placeholder={placeholder}
        mode="outlined"
        editable={false}
        onPressIn={handlePress}
        error={error}
        disabled={disabled}
        style={style}
        outlineStyle={outlineStyle}
        left={
          left || (
            <TextInput.Icon
              icon="calendar"
              onPress={handlePress}
              disabled={disabled}
            />
          )
        }
        right={
          value ? (
            <TextInput.Icon
              icon="close-circle"
              onPress={() => {
                if (!disabled) {
                  onChange('')
                }
              }}
              disabled={disabled}
            />
          ) : undefined
        }
      />
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              {label}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              <Text variant="labelSmall" style={styles.pickerLabel}>Year</Text>
              <Picker
                selectedValue={tempDate.year}
                onValueChange={(year) => {
                  setTempDate({ ...tempDate, year })
                }}
                style={styles.picker}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrapper}>
              <Text variant="labelSmall" style={styles.pickerLabel}>Month</Text>
              <Picker
                selectedValue={tempDate.month}
                onValueChange={(month) => {
                  setTempDate({ ...tempDate, month })
                }}
                style={styles.picker}
              >
                {months.map((month) => (
                  <Picker.Item
                    key={month}
                    label={monthNames[month - 1]}
                    value={month}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrapper}>
              <Text variant="labelSmall" style={styles.pickerLabel}>Day</Text>
              <Picker
                selectedValue={tempDate.day}
                onValueChange={(day) => setTempDate({ ...tempDate, day })}
                style={styles.picker}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowModal(false)} style={styles.cancelButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.confirmButton}
            >
              Confirm
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  )
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    minHeight: 200,
  },
  pickerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    marginBottom: 8,
    color: '#666',
  },
  picker: {
    width: '100%',
    height: 150,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
  },
})
