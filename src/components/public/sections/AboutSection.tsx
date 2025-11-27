import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'

const ABOUT_TEXT_SHORT = 'Our dojo is dedicated to teaching traditional Shotokan Karate, helping students develop physical strength, mental discipline, and character.'
const ABOUT_TEXT_FULL = `Our dojo is dedicated to teaching traditional Shotokan Karate, helping students develop physical strength, mental discipline, and character.

We provide comprehensive training for students of all ages and skill levels, from beginners to advanced practitioners. Our experienced instructors are committed to helping each student reach their full potential.

With multiple training locations and flexible schedules, we make it easy for students to pursue their karate journey while balancing other commitments.`

export function AboutSection() {
  const [expanded, setExpanded] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          About Our Dojo
        </Text>
      </View>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="bodyLarge" style={styles.text}>
            {expanded ? ABOUT_TEXT_FULL : ABOUT_TEXT_SHORT}
          </Text>
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.readMoreButton}
          >
            <Text variant="bodyMedium" style={styles.readMoreText}>
              {expanded ? 'Show Less' : 'Read More →'}
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 20,
  },
  text: {
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 12,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  readMoreText: {
    color: '#7B2CBF',
    fontWeight: '500',
  },
})

