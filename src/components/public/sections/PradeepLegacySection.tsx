import { useState } from 'react'
import { View, StyleSheet, Image, Dimensions } from 'react-native'
import { Card, Text, Chip } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { Instructor } from '@/lib/public/types/public.types'

interface PradeepLegacySectionProps {
  instructors: Instructor[]
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

export function PradeepLegacySection({ instructors }: PradeepLegacySectionProps) {
  const [imageError, setImageError] = useState(false)
  
  const pradeep = instructors.find((inst) =>
    inst.name.toLowerCase().includes('pradeep')
  )

  if (!pradeep) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        In Memory of Shihan Pradeep Kumar
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Master & mentor of our founder. His teachings guide every class we teach today.
      </Text>

      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.imageAndBadge}>
            <View style={styles.imageWrapper}>
              {pradeep.profile_image_url && !imageError ? (
                <Image
                  source={{ uri: pradeep.profile_image_url }}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="karate" size={64} color="#7B2CBF" />
                </View>
              )}
            </View>
            <Chip
              mode="flat"
              icon="medal"
              style={styles.badge}
              textStyle={styles.badgeText}
            >
              Founder&apos;s Master
            </Chip>
          </View>

          <View style={styles.textBlock}>
            <Text variant="titleLarge" style={styles.name}>
              {pradeep.name}
            </Text>
            {pradeep.belt_rank && (
              <Text variant="bodyMedium" style={styles.rank}>
                {pradeep.belt_rank}
              </Text>
            )}
            <Text variant="bodyMedium" style={styles.legacyText}>
              Late Shihan Pradeep Kumar was the guiding pillar of our dojo. His discipline,
              humility, and deep understanding of Shotokan Karate shaped the training philosophy
              we follow today. We honour his legacy in every bow, every technique, and every class.
            </Text>
            <View style={styles.quoteContainer}>
              <MaterialCommunityIcons
                name="format-quote-open"
                size={28}
                color="#7B2CBF"
                style={styles.quoteIcon}
              />
              <Text variant="bodyLarge" style={styles.quote}>
                &quot;Karate is not about fighting others, it is about fighting your own limits.&quot;
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: IS_MOBILE ? 20 : 24,
    paddingHorizontal: IS_MOBILE ? 16 : 20,
  },
  imageAndBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    marginTop: 10,
    backgroundColor: '#EEF2FF',
  },
  badgeText: {
    color: '#4C1D95',
    fontWeight: '600',
  },
  textBlock: {
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  rank: {
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 12,
  },
  legacyText: {
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  quoteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  quote: {
    color: '#4B5563',
    fontStyle: 'italic',
    flex: 1,
  },
})


