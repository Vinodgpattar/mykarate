import { View, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const QUOTE = 'The ultimate aim of karate lies not in victory or defeat, but in the perfection of the character of its participants.'
const AUTHOR = 'Master Gichin Funakoshi'

export function PhilosophySection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Philosophy
        </Text>
      </View>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.quoteContainer}>
            <MaterialCommunityIcons
              name="format-quote-open"
              size={32}
              color="#7B2CBF"
              style={styles.quoteIcon}
            />
            <Text variant="titleMedium" style={styles.quote}>
              {QUOTE}
            </Text>
            <View style={styles.authorContainer}>
              <Text variant="bodyMedium" style={styles.author}>
                — {AUTHOR}
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
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  card: {
    marginHorizontal: 16,
    elevation: 1,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  cardContent: {
    padding: 24,
  },
  quoteContainer: {
    alignItems: 'center',
  },
  quoteIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  quote: {
    fontStyle: 'italic',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
  },
  authorContainer: {
    alignSelf: 'flex-end',
  },
  author: {
    color: '#6B7280',
    fontWeight: '500',
  },
})

