import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { usePublicData } from '@/lib/public/hooks/usePublicData'

interface Program {
  id: string
  name: string
  description: string
  icon: string
  ageGroup?: string
  highlights?: string[]
  ctaPrimary?: string
  ctaSecondary?: string
  color?: string
  badge?: string
}

const PROGRAMS: Program[] = [
  {
    id: '1',
    name: 'Kids Program',
    ageGroup: 'Ages 5–12',
    description: 'Fun and engaging karate training designed specifically for children. Builds confidence, discipline, and physical fitness.',
    icon: 'karate',
    highlights: [
      'Builds confidence & self-esteem',
      'Improves focus & coordination',
      'Fun workouts & games',
      'Discipline & respect training',
    ],
    ctaPrimary: 'Join Now',
    ctaSecondary: 'Learn More',
    color: '#F4E3FF',
    badge: 'Most Popular',
  },
  {
    id: '2',
    name: 'Adult Program',
    ageGroup: 'Ages 13+',
    description: 'Comprehensive karate training for adults of all levels. Improve fitness, learn self-defense, and master traditional karate techniques.',
    icon: 'account-group',
    highlights: [
      'All skill levels welcome',
      'Self-defense techniques',
      'Fitness & conditioning',
      'Traditional karate forms',
    ],
    ctaPrimary: 'Join Now',
    ctaSecondary: 'Learn More',
    color: '#E3F2FD',
    badge: 'Best Value',
  },
  {
    id: '3',
    name: 'Advanced Training',
    ageGroup: 'Black Belt & Above',
    description: 'Intensive training for advanced students. Focus on advanced techniques, kata, and competition preparation.',
    icon: 'sword-cross',
    highlights: [
      'Advanced kata & techniques',
      'Competition preparation',
      'Master-level training',
      'Elite instructor guidance',
    ],
    ctaPrimary: 'Enroll Now',
    ctaSecondary: 'Learn More',
    color: '#FFF3E0',
    badge: 'Elite',
  },
  {
    id: '4',
    name: 'Personality Development',
    ageGroup: 'All Ages',
    description: 'Build character, confidence, and leadership skills through karate training. Develop discipline and respect.',
    icon: 'star-circle',
    highlights: [
      'Character building',
      'Leadership skills',
      'Confidence boost',
      'Discipline & respect',
    ],
    ctaPrimary: 'Join Now',
    ctaSecondary: 'Learn More',
    color: '#F1F8E9',
    badge: 'Life Skills',
  },
  {
    id: '5',
    name: "Women's Self-Defense",
    ageGroup: 'Women 16+',
    description: 'Practical self-defense techniques for women. Learn to protect yourself with confidence and awareness.',
    icon: 'shield-lock',
    highlights: [
      'Real-life attack defense',
      'Situational awareness',
      'Escape techniques',
      'Empowerment training',
    ],
    ctaPrimary: 'Join Now',
    ctaSecondary: 'Learn More',
    color: '#FCE4EC',
    badge: 'Essential',
  },
  {
    id: '6',
    name: 'Special Workshops',
    ageGroup: 'All Students',
    description: 'Regular workshops on specific topics like kata, kumite, and karate philosophy. Open to all students.',
    icon: 'calendar-star',
    highlights: [
      'Kata workshops',
      'Kumite training',
      'Karate philosophy',
      'Guest instructors',
    ],
    ctaPrimary: 'View Schedule',
    ctaSecondary: 'Learn More',
    color: '#E8EAF6',
    badge: 'Workshop',
  },
]

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets()
  const { data, loading } = usePublicData()

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
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 16 }]}>
          <Text variant="headlineMedium" style={styles.heroTitle}>
            Karate Programs for All Ages
          </Text>
          <Text variant="bodyLarge" style={styles.heroSubtitle}>
            Train with certified instructors. Build confidence, discipline, and strength.
          </Text>
        </View>

        {/* Programs List */}
        <View style={styles.programsHeader}>
          <Text variant="titleLarge" style={styles.programsTitle}>
            Our Programs
          </Text>
        </View>

        {PROGRAMS.map((program) => (
          <Card key={program.id} style={[styles.programCard, { backgroundColor: program.color || '#FFFFFF' }]} mode="elevated">
            <Card.Content style={styles.programCardContent}>
              {/* Header with Icon, Name, Badge */}
              <View style={styles.programHeader}>
                <View style={styles.programHeaderLeft}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name={program.icon as any}
                      size={36}
                      color="#7B2CBF"
                    />
                  </View>
                  <View style={styles.programTitleContainer}>
                    <Text variant="titleMedium" style={styles.programName}>
                      {program.name}
                    </Text>
                    {program.ageGroup && (
                      <Text variant="bodySmall" style={styles.ageGroup}>
                        {program.ageGroup}
                      </Text>
                    )}
                  </View>
                </View>
                {program.badge && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeTextSmall}>{program.badge}</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <Text variant="bodyMedium" style={styles.programDescription}>
                {program.description}
              </Text>

              {/* Highlights */}
              {program.highlights && program.highlights.length > 0 && (
                <View style={styles.highlightsContainer}>
                  {program.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightItem}>
                      <MaterialCommunityIcons name="check-circle" size={18} color="#34A853" />
                      <Text variant="bodySmall" style={styles.highlightText}>
                        {highlight}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

            </Card.Content>
          </Card>
        ))}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heroTitle: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  // Programs Header
  programsHeader: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  programsTitle: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 24,
  },
  // Program Cards
  programCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  programCardContent: {
    padding: 20,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  programHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  programTitleContainer: {
    flex: 1,
  },
  programName: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 20,
    marginBottom: 4,
  },
  ageGroup: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  badgeContainer: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTextSmall: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  programDescription: {
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
    fontSize: 15,
  },
  highlightsContainer: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  highlightText: {
    color: '#374151',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
})
