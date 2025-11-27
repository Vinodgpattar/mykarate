import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { usePublicData } from '@/lib/public/hooks/usePublicData'

const PROGRAMS = [
  {
    id: '1',
    name: 'Kids Program',
    ageGroup: 'Ages 5-12',
    description: 'Fun and engaging karate training designed specifically for children. Builds confidence, discipline, and physical fitness through age-appropriate techniques and games.',
    benefits: ['Confidence Building', 'Discipline & Respect', 'Physical Fitness', 'Focus & Concentration'],
    icon: 'baby-face-outline',
    color: '#7B2CBF',
  },
  {
    id: '2',
    name: 'Youth Program',
    ageGroup: 'Ages 13-17',
    description: 'Advanced training for teenagers focusing on technique refinement, competition preparation, and character development. Perfect for building leadership skills and self-confidence.',
    benefits: ['Advanced Techniques', 'Competition Prep', 'Leadership Skills', 'Character Development'],
    icon: 'account-group',
    color: '#7B2CBF',
  },
  {
    id: '3',
    name: 'Adult Program',
    ageGroup: '18+ Years',
    description: 'Comprehensive karate training for adults of all fitness levels. Improve physical fitness, learn practical self-defense, and master traditional Shotokan techniques at your own pace.',
    benefits: ['Fitness & Wellness', 'Self-Defense', 'Stress Relief', 'Flexible Schedule'],
    icon: 'account',
    color: '#7B2CBF',
  },
  {
    id: '4',
    name: 'Advanced Training',
    ageGroup: 'Brown & Black Belts',
    description: 'Intensive training for advanced students focusing on advanced kata, kumite techniques, and teaching methods. Prepare for higher belt ranks and instructor certification.',
    benefits: ['Advanced Kata', 'Kumite Mastery', 'Teaching Methods', 'Belt Advancement'],
    icon: 'sword-cross',
    color: '#7B2CBF',
  },
  {
    id: '5',
    name: "Women's Self-Defense",
    ageGroup: 'All Ages',
    description: 'Practical self-defense techniques specifically designed for women. Learn to protect yourself with confidence, awareness, and effective techniques in a supportive environment.',
    benefits: ['Practical Techniques', 'Confidence Building', 'Safety Awareness', 'Empowerment'],
    icon: 'shield-lock',
    color: '#7B2CBF',
  },
  {
    id: '6',
    name: 'Personality Development',
    ageGroup: 'All Ages',
    description: 'Build character, confidence, and leadership skills through karate training. Develop discipline, respect, and life skills that extend beyond the dojo.',
    benefits: ['Character Building', 'Leadership Skills', 'Life Skills', 'Personal Growth'],
    icon: 'account-heart',
    color: '#7B2CBF',
  },
  {
    id: '7',
    name: 'Competition Training',
    ageGroup: 'All Levels',
    description: 'Specialized training for students interested in karate competitions. Focus on kata performance, kumite strategies, and tournament preparation with experienced coaches.',
    benefits: ['Tournament Prep', 'Kata Performance', 'Kumite Strategies', 'Competition Experience'],
    icon: 'trophy',
    color: '#7B2CBF',
  },
  {
    id: '8',
    name: 'Special Workshops',
    ageGroup: 'All Students',
    description: 'Regular workshops on specific topics like advanced kata, belt testing preparation, and karate philosophy. Open to all students for continuous learning and skill enhancement.',
    benefits: ['Focused Learning', 'Skill Enhancement', 'Belt Testing Prep', 'Philosophy & History'],
    icon: 'calendar-star',
    color: '#7B2CBF',
  },
]

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
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
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Our Programs
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

        {PROGRAMS.map((program) => (
          <Card key={program.id} style={styles.programCard} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={program.icon as any}
                    size={32}
                    color={program.color}
                  />
                </View>
                <View style={styles.titleContainer}>
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
              </View>

              <Text variant="bodyMedium" style={styles.description}>
                {program.description}
              </Text>

              <View style={styles.benefitsContainer}>
                <Text variant="labelMedium" style={styles.benefitsTitle}>
                  Key Benefits:
                </Text>
                <View style={styles.benefitsList}>
                  {program.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color="#7B2CBF"
                        style={styles.checkIcon}
                      />
                      <Text variant="bodySmall" style={styles.benefitText}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Button
                mode="outlined"
                onPress={() => router.push('/(public)/locations')}
                style={styles.ctaButton}
                contentStyle={styles.ctaButtonContent}
                labelStyle={styles.ctaButtonLabel}
                textColor="#7B2CBF"
                icon="arrow-right"
              >
                Learn More
              </Button>
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  introSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  introText: {
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
  },
  programCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  programName: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  ageChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    height: 28,
  },
  ageChipText: {
    color: '#4C1D95',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  benefitsContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  benefitsTitle: {
    color: '#111827',
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  benefitText: {
    color: '#6B7280',
    flex: 1,
  },
  ctaButton: {
    borderRadius: 20,
    borderColor: '#7B2CBF',
    alignSelf: 'flex-start',
  },
  ctaButtonContent: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  ctaButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
})

