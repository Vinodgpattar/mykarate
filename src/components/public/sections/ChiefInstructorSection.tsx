import { View, StyleSheet, Image, Dimensions } from 'react-native'
import { Text, Card, Chip, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type { Instructor } from '@/lib/public/types/public.types'
import { logger } from '@/lib/logger'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

interface ChiefInstructorSectionProps {
  instructor: Instructor | null
}

export function ChiefInstructorSection({ instructor }: ChiefInstructorSectionProps) {
  const router = useRouter()

  if (!instructor) {
    return null
  }

  return (
    <Card style={styles.card} mode="elevated">
      <View style={styles.content}>
        {/* Mobile: Image first, Desktop: Image on right */}
        {IS_MOBILE && (
          <View style={styles.imageContainer}>
            {instructor.profile_image_url ? (
              <View style={styles.imageFrame}>
                <Image
                  source={{ uri: instructor.profile_image_url }}
                  style={styles.instructorImage}
                  resizeMode="contain"
                  onError={() => {
                    logger.warn('Chief instructor image failed to load', { url: instructor.profile_image_url })
                  }}
                />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="account" size={IS_MOBILE ? 60 : 80} color="#9CA3AF" />
              </View>
            )}
          </View>
        )}

        {/* Left Side - Content */}
        <View style={styles.textContainer}>
          <Chip
            mode="flat"
            icon="crown"
            style={styles.chiefBadge}
            textStyle={styles.chiefBadgeText}
          >
            Chief Instructor
          </Chip>

          <Text variant="headlineSmall" style={styles.name}>
            {instructor.name}
          </Text>

          {instructor.belt_rank && (
            <Text variant="titleMedium" style={styles.rank}>
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

        {/* Desktop: Image on right */}
        {!IS_MOBILE && (
          <View style={styles.imageContainer}>
            {instructor.profile_image_url ? (
              <View style={styles.imageFrame}>
                <Image
                  source={{ uri: instructor.profile_image_url }}
                  style={styles.instructorImage}
                  resizeMode="contain"
                  onError={() => {
                    logger.warn('Chief instructor image failed to load', { url: instructor.profile_image_url })
                  }}
                />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="account" size={80} color="#9CA3AF" />
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  content: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    padding: IS_MOBILE ? 20 : 24,
    gap: IS_MOBILE ? 16 : 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: IS_MOBILE ? 10 : 12,
    minWidth: 0,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
    width: IS_MOBILE ? '100%' : 'auto',
  },
  chiefBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
  },
  chiefBadgeText: {
    color: '#92400E',
    fontWeight: '600',
    fontSize: 11,
  },
  name: {
    color: '#111827',
    fontWeight: '700',
    lineHeight: IS_MOBILE ? 28 : 32,
    fontSize: IS_MOBILE ? 22 : 24,
  },
  rank: {
    color: '#7B2CBF',
    fontWeight: '600',
    fontSize: IS_MOBILE ? 16 : 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: IS_MOBILE ? 6 : 8,
  },
  intro: {
    color: '#374151',
    lineHeight: IS_MOBILE ? 22 : 24,
    fontSize: IS_MOBILE ? 15 : 16,
  },
  bio: {
    color: '#6B7280',
    lineHeight: IS_MOBILE ? 20 : 22,
    fontSize: IS_MOBILE ? 14 : 15,
    marginTop: 4,
  },
  ctaButton: {
    borderRadius: 20,
    borderColor: '#7B2CBF',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ctaButtonContent: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ctaButtonLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  imageFrame: {
    width: '100%',
    maxWidth: IS_MOBILE ? '100%' : 280,
    aspectRatio: IS_MOBILE ? 3/4 : 4/5,
    borderRadius: IS_MOBILE ? 16 : 18,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    borderWidth: IS_MOBILE ? 2 : 3,
    borderColor: '#7B2CBF',
    padding: 0,
    elevation: 3,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  instructorImage: {
    width: '100%',
    height: '100%',
    borderRadius: IS_MOBILE ? 14 : 15,
  },
  imagePlaceholder: {
    width: '100%',
    maxWidth: IS_MOBILE ? '100%' : 280,
    aspectRatio: IS_MOBILE ? 3/4 : 4/5,
    borderRadius: IS_MOBILE ? 16 : 18,
    backgroundColor: '#F9FAFB',
    borderWidth: IS_MOBILE ? 2 : 3,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

