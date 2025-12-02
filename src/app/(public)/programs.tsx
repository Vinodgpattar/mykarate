import { useMemo } from 'react'
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native'
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { usePublicData } from '@/lib/public/hooks/usePublicData'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

const PROGRAMS = [
  {
    id: '1',
    name: 'Kids Program',
    ageGroup: 'Ages 5-12',
    description: 'Fun and engaging karate training designed specifically for children. Builds confidence, discipline, and physical fitness through age-appropriate techniques and games.',
    benefits: ['Confidence Building', 'Discipline & Respect', 'Physical Fitness', 'Focus & Concentration'],
    gradient: ['#7B2CBF', '#9D4EDD'],
  },
  {
    id: '2',
    name: 'Youth Program',
    ageGroup: 'Ages 13-17',
    description: 'Advanced training for teenagers focusing on technique refinement, competition preparation, and character development. Perfect for building leadership skills and self-confidence.',
    benefits: ['Advanced Techniques', 'Competition Prep', 'Leadership Skills', 'Character Development'],
    gradient: ['#6366F1', '#818CF8'],
  },
  {
    id: '3',
    name: 'Adult Program',
    ageGroup: '18+ Years',
    description: 'Comprehensive karate training for adults of all fitness levels. Improve physical fitness, learn practical self-defense, and master traditional Shotokan techniques at your own pace.',
    benefits: ['Fitness & Wellness', 'Self-Defense', 'Stress Relief', 'Flexible Schedule'],
    gradient: ['#EC4899', '#F472B6'],
  },
  {
    id: '4',
    name: 'Advanced Training',
    ageGroup: 'Brown & Black Belts',
    description: 'Intensive training for advanced students focusing on advanced kata, kumite techniques, and teaching methods. Prepare for higher belt ranks and instructor certification.',
    benefits: ['Advanced Kata', 'Kumite Mastery', 'Teaching Methods', 'Belt Advancement'],
    gradient: ['#F59E0B', '#FBBF24'],
  },
  {
    id: '5',
    name: "Women's Self-Defense",
    ageGroup: 'All Ages',
    description: 'Practical self-defense techniques specifically designed for women. Learn to protect yourself with confidence, awareness, and effective techniques in a supportive environment.',
    benefits: ['Practical Techniques', 'Confidence Building', 'Safety Awareness', 'Empowerment'],
    gradient: ['#10B981', '#34D399'],
  },
  {
    id: '6',
    name: 'Personality Development',
    ageGroup: 'All Ages',
    description: 'Build character, confidence, and leadership skills through karate training. Develop discipline, respect, and life skills that extend beyond the dojo.',
    benefits: ['Character Building', 'Leadership Skills', 'Life Skills', 'Personal Growth'],
    gradient: ['#8B5CF6', '#A78BFA'],
  },
  {
    id: '7',
    name: 'Competition Training',
    ageGroup: 'All Levels',
    description: 'Specialized training for students interested in karate competitions. Focus on kata performance, kumite strategies, and tournament preparation with experienced coaches.',
    benefits: ['Tournament Prep', 'Kata Performance', 'Kumite Strategies', 'Competition Experience'],
    gradient: ['#EF4444', '#F87171'],
  },
  {
    id: '8',
    name: 'Special Workshops',
    ageGroup: 'All Students',
    description: 'Regular workshops on specific topics like advanced kata, belt testing preparation, and karate philosophy. Open to all students for continuous learning and skill enhancement.',
    benefits: ['Focused Learning', 'Skill Enhancement', 'Belt Testing Prep', 'Philosophy & History'],
    gradient: ['#64748B', '#94A3B8'],
  },
]

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, loading } = usePublicData()

  // Get gallery images (only active images)
  const galleryImages = useMemo(() => {
    if (!data?.galleryItems) return []
    return data.galleryItems
      .filter(item => item.media_type === 'image' && item.is_active)
      .map(item => item.file_url)
  }, [data?.galleryItems])

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading programs...
        </Text>
      </View>
    )
  }

  const dojoName = data?.branches && data.branches.length > 0 
    ? data.branches[0].name 
    : 'Karate Sports Club Hubballi'

  return (
    <View style={styles.container}>
      <PublicHeader logoUrl={data?.logoUrl} dojoName={dojoName} />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineMedium" style={styles.title}>
          Our Programs
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Comprehensive training for all ages and skill levels
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text variant="bodyLarge" style={styles.introText}>
            Discover our comprehensive range of karate programs designed for students of all ages and skill levels. 
            Each program is carefully structured to help you achieve your goals while maintaining the traditional 
            values of Shotokan Karate.
          </Text>
        </View>

        {PROGRAMS.map((program, index) => {
          // Use gallery image if available, cycle through if we have fewer than 8 images
          const imageUrl = galleryImages.length > 0 
            ? galleryImages[index % galleryImages.length] 
            : null

          return (
            <Card key={program.id} style={styles.programCard} mode="elevated">
              <Card.Content style={styles.cardContent}>
                {/* Image Section */}
                {imageUrl ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.programImage}
                      resizeMode="contain"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.imageOverlay}
                    />
                    <View style={styles.imageContent}>
                      <Chip
                        mode="flat"
                        style={styles.ageChipOverlay}
                        textStyle={styles.ageChipOverlayText}
                      >
                        {program.ageGroup}
                      </Chip>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: program.gradient[0] + '20' }]}>
                    <LinearGradient
                      colors={program.gradient as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.placeholderGradient}
                    >
                      <View style={styles.placeholderContent}>
                        <Text variant="headlineMedium" style={styles.placeholderTitle}>
                          {program.name}
                        </Text>
                        <Chip
                          mode="flat"
                          style={styles.ageChipPlaceholder}
                          textStyle={styles.ageChipPlaceholderText}
                        >
                          {program.ageGroup}
                        </Chip>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {/* Content Section */}
                <View style={styles.contentSection}>
                  {!imageUrl && (
                    <View style={styles.titleRow}>
                      <Text variant="titleLarge" style={styles.programName}>
                        {program.name}
                      </Text>
                      <Chip
                        mode="flat"
                        style={styles.ageChip}
                        textStyle={styles.ageChipText}
                      >
                        {program.ageGroup}
                      </Chip>
                    </View>
                  )}

                  <Text variant="bodyMedium" style={styles.description}>
                    {program.description}
                  </Text>

                  <View style={styles.benefitsContainer}>
                    <Text variant="labelMedium" style={styles.benefitsTitle}>
                      Key Benefits
                    </Text>
                    <View style={styles.benefitsGrid}>
                      {program.benefits.map((benefit, idx) => (
                        <View key={idx} style={styles.benefitChip}>
                          <View style={[styles.benefitDot, { backgroundColor: program.gradient[0] }]} />
                          <Text variant="bodySmall" style={styles.benefitText}>
                            {benefit}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Button
                    mode="contained"
                    onPress={() => router.push('/(public)/locations')}
                    style={[styles.ctaButton, { backgroundColor: program.gradient[0] }]}
                    contentStyle={styles.ctaButtonContent}
                    labelStyle={styles.ctaButtonLabel}
                    icon="arrow-right"
                  >
                    Learn More
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  title: {
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: IS_MOBILE ? 16 : 24,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  introSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  introText: {
    color: '#374151',
    lineHeight: 26,
    textAlign: 'center',
    fontSize: 16,
  },
  programCard: {
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    height: IS_MOBILE ? 220 : 280,
    position: 'relative',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  programImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  imageContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ageChipOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    height: 32,
  },
  ageChipOverlayText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  imagePlaceholder: {
    width: '100%',
    height: IS_MOBILE ? 180 : 220,
    borderRadius: 0,
    overflow: 'hidden',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderContent: {
    alignItems: 'center',
    gap: 12,
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ageChipPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    height: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  ageChipPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentSection: {
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  programName: {
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  ageChip: {
    backgroundColor: '#F3F4F6',
    height: 32,
    alignSelf: 'flex-start',
  },
  ageChipText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
    fontSize: 15,
  },
  benefitsContainer: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  benefitsTitle: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 16,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  benefitText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ctaButton: {
    borderRadius: 16,
    alignSelf: 'flex-start',
    elevation: 0,
  },
  ctaButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  ctaButtonLabel: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
})

