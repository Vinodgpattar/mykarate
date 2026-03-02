import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface ScheduleItem {
  days: string
  time: string
}

interface LocationCardProps {
  name: string
  address: string
  mapsUrl: string
  schedule: ScheduleItem[]
  onMapsPress: (url: string) => void
}

export function LocationCard({
  name,
  address,
  mapsUrl,
  schedule,
  onMapsPress,
}: LocationCardProps) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.cardContent}>
        {/* Location Header */}
        <View style={styles.locationHeader}>
          <MaterialCommunityIcons name="map-marker" size={24} color="#7B2CBF" />
          <Text variant="titleLarge" style={styles.locationName}>
            {name}
          </Text>
        </View>

        {/* Address */}
        <View style={styles.addressContainer}>
          <Text variant="bodyMedium" style={styles.address}>
            {address}
          </Text>
        </View>

        {/* Google Maps Button - Real App Icon */}
        <TouchableOpacity
          style={styles.mapsButton}
          onPress={() => onMapsPress(mapsUrl)}
          activeOpacity={0.8}
          accessibilityLabel="Open location in Google Maps"
          accessibilityRole="button"
        >
          <View style={styles.mapsIconContainer}>
            {/* Real Google Maps App Icon */}
            <View style={styles.googleMapsIconWrapper}>
              <MaterialCommunityIcons name="google-maps" size={32} color="#4285F4" />
            </View>
          </View>
          <View style={styles.mapsButtonContent}>
            <Text variant="titleSmall" style={styles.mapsButtonText}>
              Open in Google Maps
            </Text>
            <Text variant="bodySmall" style={styles.mapsButtonSubtext}>
              Get directions
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#4285F4" />
        </TouchableOpacity>

        {/* Training Schedule */}
        <View style={styles.scheduleContainer}>
          <Text variant="labelMedium" style={styles.scheduleTitle}>
            Training Schedule:
          </Text>
          {schedule.map((item, index) => (
            <View key={index} style={styles.scheduleItem}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={16}
                color="#6B7280"
                style={styles.scheduleIcon}
              />
              <View style={styles.scheduleText}>
                <Text variant="bodySmall" style={styles.scheduleDays}>
                  {item.days}
                </Text>
                <Text variant="bodySmall" style={styles.scheduleTime}>
                  {item.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  locationName: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 20,
  },
  addressContainer: {
    marginBottom: 20,
  },
  address: {
    color: '#374151',
    lineHeight: 24,
    fontSize: 15,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#4285F4',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapsIconContainer: {
    marginRight: 16,
  },
  googleMapsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8F0FE',
  },
  mapsButtonContent: {
    flex: 1,
  },
  mapsButtonText: {
    color: '#4285F4',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  mapsButtonSubtext: {
    color: '#6B7280',
    fontSize: 12,
  },
  scheduleContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  scheduleTitle: {
    color: '#111827',
    fontWeight: '600',
    marginBottom: 16,
    fontSize: 14,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  scheduleIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  scheduleText: {
    flex: 1,
  },
  scheduleDays: {
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 13,
  },
  scheduleTime: {
    color: '#6B7280',
    fontSize: 13,
  },
})


