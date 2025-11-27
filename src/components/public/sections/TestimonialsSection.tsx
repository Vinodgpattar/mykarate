import { View, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface Testimonial {
  id: string
  name: string
  belt?: string
  quote: string
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

// Sample testimonials - can be moved to database later
const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    belt: 'Brown Belt',
    quote: 'This dojo has been instrumental in my karate journey. The expert instructors and traditional training methods have helped me develop both physical strength and mental discipline.',
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    belt: 'Black Belt',
    quote: 'Best karate dojo in Hubballi! The training environment is excellent, and the instructors are truly dedicated to helping students achieve their goals.',
  },
  {
    id: '3',
    name: 'Ananya Desai',
    belt: 'Purple Belt',
    quote: 'I\'ve been training here for 2 years and highly recommend it to anyone serious about learning Shotokan Karate. The community is supportive and welcoming.',
  },
]

export function TestimonialsSection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          What Our Students Say
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Success stories from Hubballi students
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.quoteContainer}>
                <MaterialCommunityIcons
                  name="format-quote-open"
                  size={32}
                  color="#7B2CBF"
                  style={styles.quoteIcon}
                />
              </View>
              <Text variant="bodyLarge" style={styles.quote}>
                {testimonial.quote}
              </Text>
              <View style={styles.authorContainer}>
                <View style={styles.authorInfo}>
                  <Text variant="titleMedium" style={styles.authorName}>
                    {testimonial.name}
                  </Text>
                  {testimonial.belt && (
                    <Text variant="bodySmall" style={styles.authorBelt}>
                      {testimonial.belt}
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: IS_MOBILE ? 40 : 60,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: IS_MOBILE ? 24 : 48,
    marginBottom: IS_MOBILE ? 24 : 32,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: IS_MOBILE ? 24 : 48,
    gap: 16,
  },
  card: {
    width: IS_MOBILE ? SCREEN_WIDTH * 0.85 : 380,
    marginRight: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: IS_MOBILE ? 20 : 24,
  },
  quoteContainer: {
    marginBottom: 12,
  },
  quoteIcon: {
    opacity: 0.3,
  },
  quote: {
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  authorBelt: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
})

