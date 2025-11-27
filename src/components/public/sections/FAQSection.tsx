import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { Text, Divider } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

// Sample FAQs - can be moved to database later
const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'Where is the dojo located in Hubballi?',
    answer: 'Our dojo is located in Hubballi. We have multiple training locations. Please check the Locations section for detailed addresses and contact information for each branch.',
  },
  {
    id: '2',
    question: 'What are the training fees?',
    answer: 'We offer flexible training plans including monthly and yearly options. Registration fees apply for new students. Please visit the Membership section or contact us for detailed pricing information.',
  },
  {
    id: '3',
    question: 'What age groups do you train?',
    answer: 'We welcome students of all ages! We have specialized programs for kids, adults, and advanced practitioners. Our instructors are experienced in teaching students from beginners to advanced levels.',
  },
  {
    id: '4',
    question: 'Do I need prior experience to join?',
    answer: 'No prior experience is required! We welcome complete beginners and provide comprehensive training from the basics. Our instructors will guide you through every step of your karate journey.',
  },
  {
    id: '5',
    question: 'What style of karate do you teach?',
    answer: 'We specialize in Shotokan Karate, one of the most widely practiced styles. Our training follows traditional Shotokan principles while incorporating modern teaching methods for effective learning.',
  },
  {
    id: '6',
    question: 'How often are classes held?',
    answer: 'Classes are held multiple times per week. We offer flexible schedules to accommodate different needs. Please contact us or visit the Programs section for detailed class schedules.',
  },
]

export function FAQSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Frequently Asked Questions
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Common questions about our dojo in Hubballi
        </Text>
      </View>

      <View style={styles.faqContainer}>
        {faqs.map((faq, index) => {
          const isExpanded = expandedId === faq.id
          return (
            <View key={faq.id}>
              <TouchableOpacity
                style={styles.faqItem}
                onPress={() => toggleExpanded(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.questionContainer}>
                  <Text variant="titleMedium" style={styles.question}>
                    {faq.question}
                  </Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#7B2CBF"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.answerContainer}>
                  <Text variant="bodyLarge" style={styles.answer}>
                    {faq.answer}
                  </Text>
                </View>
              )}

              {index < faqs.length - 1 && <Divider style={styles.divider} />}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: IS_MOBILE ? 40 : 60,
    backgroundColor: '#F9FAFB',
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
  faqContainer: {
    paddingHorizontal: IS_MOBILE ? 24 : 48,
  },
  faqItem: {
    paddingVertical: IS_MOBILE ? 16 : 20,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    flex: 1,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 16,
    lineHeight: 24,
  },
  answerContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingLeft: 0,
  },
  answer: {
    color: '#6B7280',
    lineHeight: 24,
  },
  divider: {
    marginVertical: 0,
  },
})

