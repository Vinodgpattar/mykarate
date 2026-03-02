import { View, StyleSheet, Image } from 'react-native'
import { Text } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { COLORS, RADIUS, SPACING, ELEVATION } from '@/lib/design-system'

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
    <View style={styles.container}>
      <LinearGradient
     colors={['#FF9933', '#FFFFFF', '#FFFFFF', '#138808'] as [string, string, string, string]}
     locations={[0, 0.45, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.overlay} />
          <View style={styles.contentInner}>
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
              Here&apos;s what&apos;s happening at your dojo today
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  gradient: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: ELEVATION.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  content: {
    position: 'relative',
    padding: SPACING.xl + 4,
    paddingVertical: SPACING.xl + 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: RADIUS.lg,
  },
  contentInner: {
    position: 'relative',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md + 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md + 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: SPACING.md + 4,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#1F2937',
    fontWeight: '800',
    marginBottom: SPACING.xs + 2,
    fontSize: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: -0.3,
  },
  dateTime: {
    color: '#7B2CBF',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})

