import { View, StyleSheet, Image } from 'react-native'
import { Text } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { COLORS, RADIUS, SPACING } from '@/lib/design-system'

interface HeroWelcomeSectionProps {
  userName?: string
  profileImageUrl?: string | null
}

export function HeroWelcomeSection({ userName, profileImageUrl }: HeroWelcomeSectionProps) {
  const hour = new Date().getHours()
  let greeting = 'Welcome back'
  let timeOfDay = ''

  if (hour < 12) {
    greeting = 'Good morning'
    timeOfDay = 'morning'
  } else if (hour < 17) {
    greeting = 'Good afternoon'
    timeOfDay = 'afternoon'
  } else {
    greeting = 'Good evening'
    timeOfDay = 'evening'
  }

  const today = format(new Date(), 'EEEE, MMM dd, yyyy')
  const time = format(new Date(), 'h:mm a')

  return (
    <LinearGradient
      colors={['#7B2CBF', '#9D4EDD', '#7B2CBF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          {profileImageUrl ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            </View>
          ) : (
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="karate" size={32} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text variant="headlineSmall" style={styles.greeting}>
              {greeting}{userName ? `, ${userName}` : ''}!
            </Text>
            <Text variant="bodyMedium" style={styles.dateTime}>
              {today} • {time}
            </Text>
          </View>
        </View>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Continue your journey to the next belt
        </Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  content: {
    padding: SPACING.xl,
    paddingVertical: SPACING.xl + 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  dateTime: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 15,
    lineHeight: 22,
  },
})


