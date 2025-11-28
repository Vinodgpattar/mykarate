import { View, StyleSheet, Image, Dimensions } from 'react-native'
import { Text, Card, Chip, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type { Instructor } from '@/lib/public/types/public.types'
import { logger } from '@/lib/logger'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

interface PradeepHeroSectionProps {
  instructor: Instructor | null
}

export function PradeepHeroSection({ instructor }: PradeepHeroSectionProps) {
  const router = useRouter()

  if (!instructor) {
    return null
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <View style={styles.content}>
          {/* Large Hero Image - Always on top */}
          <View style={styles.imageContainer}>
            {instructor.profile_image_url ? (
              <View style={styles.imageFrame}>
                <Image
                  source={{ uri: instructor.profile_image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                  onError={() => {
                    logger.warn('Hero instructor image failed to load', { url: instructor.profile_image_url })
                  }}
                />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="account" size={80} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Text Content - Always below image */}
          <View style={styles.textContainer}>
            <Chip
              mode="flat"
              icon="crown"
              style={styles.heroBadge}
              textStyle={styles.heroBadgeText}
            >
              Master & Mentor
            </Chip>

            <Text variant="headlineMedium" style={styles.name}>
              {instructor.name}
            </Text>

            {instructor.belt_rank && (
              <Text variant="titleLarge" style={styles.rank}>
                {instructor.belt_rank}
              </Text>
            )}

            <View style={styles.divider} />

            <Text variant="bodyLarge" style={styles.intro}>
              With decades of dedicated practice and teaching, {instructor.name.split(' ')[0]} brings exceptional expertise 
              and passion to our dojo. His commitment to preserving traditional Shotokan Karate while adapting to modern 
              training methods has shaped countless students into confident martial artists. Under his guidance, students 
              develop not just physical strength, but discipline, respect, and unwavering character.
            </Text>

            {instructor.description && (
              <Text variant="bodyMedium" style={styles.bio}>
                {instructor.description}
              </Text>
            )}

            <Button
              mode="outlined"
              onPress={() => router.push('/(public)/programs')}
              style={styles.ctaButton}
              contentStyle={styles.ctaButtonContent}
              labelStyle={styles.ctaButtonLabel}
              textColor="#7B2CBF"
              icon="arrow-right"
            >
              Learn from the Best
            </Button>
          </View>
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: IS_MOBILE ? 16 : 24,
    paddingTop: 24,
    paddingBottom: 0,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'column',
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: IS_MOBILE ? 4/3 : 16/9,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: IS_MOBILE ? 4/3 : 16/9,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    padding: IS_MOBILE ? 20 : 28,
    gap: IS_MOBILE ? 12 : 16,
    alignItems: 'center',
  },
  heroBadge: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
  },
  heroBadgeText: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 12,
  },
  name: {
    color: '#111827',
    fontWeight: '700',
    lineHeight: IS_MOBILE ? 32 : 40,
    fontSize: IS_MOBILE ? 26 : 32,
    textAlign: 'center',
  },
  rank: {
    color: '#7B2CBF',
    fontWeight: '600',
    fontSize: IS_MOBILE ? 18 : 22,
    textAlign: 'center',
  },
  divider: {
    width: '60%',
    height: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: IS_MOBILE ? 8 : 12,
    alignSelf: 'center',
  },
  intro: {
    color: '#374151',
    lineHeight: IS_MOBILE ? 24 : 28,
    fontSize: IS_MOBILE ? 16 : 18,
    textAlign: 'center',
  },
  bio: {
    color: '#6B7280',
    lineHeight: IS_MOBILE ? 22 : 24,
    fontSize: IS_MOBILE ? 15 : 16,
    marginTop: 4,
    textAlign: 'center',
  },
  ctaButton: {
    borderRadius: 24,
    borderColor: '#7B2CBF',
    alignSelf: 'center',
    marginTop: 8,
  },
  ctaButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  ctaButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
})

