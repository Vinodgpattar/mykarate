import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface Action {
  icon: string
  label: string
  onPress: () => void
}

interface QuickActionsSectionProps {
  onProgramsPress?: () => void
  onFeesPress?: () => void
  onInstructorsPress?: () => void
  onLocationsPress?: () => void
}

export function QuickActionsSection({
  onProgramsPress,
  onFeesPress,
  onInstructorsPress,
  onLocationsPress,
}: QuickActionsSectionProps) {
  const actions: Action[] = [
    {
      icon: 'karate',
      label: 'Programs',
      onPress: onProgramsPress || (() => {}),
    },
    {
      icon: 'cash-multiple',
      label: 'Fees',
      onPress: onFeesPress || (() => {}),
    },
    {
      icon: 'account-tie',
      label: 'Instructors',
      onPress: onInstructorsPress || (() => {}),
    },
    {
      icon: 'map-marker',
      label: 'Locations',
      onPress: onLocationsPress || (() => {}),
    },
  ]

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={action.icon as any}
                size={48}
                color="#FFFFFF"
              />
            </View>
            <Text variant="bodySmall" style={styles.label}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 20,
  },
  button: {
    alignItems: 'center',
    marginRight: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  label: {
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'center',
  },
})

