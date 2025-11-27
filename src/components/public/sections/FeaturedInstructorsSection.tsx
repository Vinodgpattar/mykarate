import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { Instructor } from '@/lib/public/types/public.types'
import { logger } from '@/lib/logger'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768
const ITEM_WIDTH = IS_MOBILE ? SCREEN_WIDTH * 0.65 : 280
const ITEM_SPACING = 12

interface FeaturedInstructorsSectionProps {
  instructors: Instructor[]
}

export function FeaturedInstructorsSection({ instructors }: FeaturedInstructorsSectionProps) {
  // Filter to get Chinmayee and Munaf
  const featuredInstructors = instructors.filter(
    (inst) =>
      inst.name.toLowerCase().includes('chinmayee') ||
      inst.name.toLowerCase().includes('munaf') ||
      inst.name.toLowerCase().includes('kanwar')
  )

  if (featuredInstructors.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Featured Instructors
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Meet our dedicated instructors
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {featuredInstructors.map((instructor) => {
          // Generate personalized intro based on instructor name
          const getInstructorIntro = (name: string) => {
            const firstName = name.split(' ')[0]
            if (name.toLowerCase().includes('chinmayee')) {
              return `With a passion for teaching and a deep understanding of Shotokan Karate fundamentals, ${firstName} brings a patient and encouraging approach to training. Her dedication to helping students master techniques while building confidence makes her an invaluable part of our instructor team.`
            } else if (name.toLowerCase().includes('munaf')) {
              return `${firstName} combines technical expertise with a motivating teaching style, inspiring students to push their limits while maintaining proper form. His commitment to each student's progress and attention to detail ensures quality training for all levels.`
            }
            return `${firstName} brings dedication and expertise to our dojo, helping students develop both physical skills and mental discipline through traditional Shotokan Karate training.`
          }

          return (
            <View key={instructor.id} style={[styles.instructorCard, { width: ITEM_WIDTH }]}>
              <Card style={styles.card} mode="elevated">
                <View style={styles.imageContainer}>
                  {instructor.profile_image_url ? (
                    <Image
                      source={{ uri: instructor.profile_image_url }}
                      style={styles.instructorImage}
                      resizeMode="cover"
                      onError={() => {
                        logger.warn('Instructor image failed to load', { url: instructor.profile_image_url })
                      }}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialCommunityIcons name="account" size={48} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <Card.Content style={styles.cardContent}>
                  <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                    {instructor.name}
                  </Text>
                  {instructor.belt_rank && (
                    <Text variant="bodyMedium" style={styles.rank} numberOfLines={1}>
                      {instructor.belt_rank}
                    </Text>
                  )}
                  {instructor.title && (
                    <Text variant="bodySmall" style={styles.titleText} numberOfLines={1}>
                      {instructor.title}
                    </Text>
                  )}
                  <View style={styles.divider} />
                  <Text variant="bodySmall" style={styles.intro} numberOfLines={5}>
                    {getInstructorIntro(instructor.name)}
                  </Text>
                  {instructor.description && (
                    <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
                      {instructor.description}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: IS_MOBILE ? 16 : 20,
    backgroundColor: '#FFF8E7',
  },
  header: {
    paddingHorizontal: IS_MOBILE ? 16 : 24,
    marginBottom: IS_MOBILE ? 10 : 12,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: IS_MOBILE ? 16 : 24,
    paddingRight: IS_MOBILE ? 16 : 24,
  },
  instructorCard: {
    marginRight: ITEM_SPACING,
  },
  card: {
    borderRadius: IS_MOBILE ? 14 : 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4/5,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  instructorImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  cardContent: {
    padding: IS_MOBILE ? 10 : 12,
    gap: 3,
  },
  name: {
    fontWeight: '700',
    color: '#111827',
    fontSize: IS_MOBILE ? 15 : 16,
    marginBottom: 2,
  },
  rank: {
    color: '#7B2CBF',
    fontWeight: '600',
    fontSize: IS_MOBILE ? 13 : 14,
    marginBottom: 2,
  },
  titleText: {
    color: '#6B7280',
    fontSize: IS_MOBILE ? 11 : 12,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  intro: {
    color: '#374151',
    fontSize: IS_MOBILE ? 11 : 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  description: {
    color: '#6B7280',
    fontSize: IS_MOBILE ? 10 : 11,
    lineHeight: 14,
    fontStyle: 'italic',
  },
})

