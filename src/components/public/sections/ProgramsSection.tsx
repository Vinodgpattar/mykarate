import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface Program {
  id: string
  name: string
  description: string
  icon: string
}

const PROGRAMS: Program[] = [
  {
    id: '1',
    name: 'Kids Program',
    description: 'Ages 5-12. Fun and engaging karate training designed specifically for children. Builds confidence, discipline, and physical fitness.',
    icon: 'baby-face-outline',
  },
  {
    id: '2',
    name: 'Adult Program',
    description: 'Comprehensive karate training for adults of all levels. Improve fitness, learn self-defense, and master traditional karate techniques.',
    icon: 'account',
  },
  {
    id: '3',
    name: 'Advanced Training',
    description: 'Intensive training for advanced students. Focus on advanced techniques, kata, and competition preparation.',
    icon: 'sword-cross',
  },
  {
    id: '4',
    name: 'Personality Development',
    description: 'Build character, confidence, and leadership skills through karate training. Develop discipline and respect.',
    icon: 'account-heart',
  },
  {
    id: '5',
    name: "Women's Self-Defense",
    description: 'Practical self-defense techniques for women. Learn to protect yourself with confidence and awareness.',
    icon: 'shield-lock',
  },
  {
    id: '6',
    name: 'Special Workshops',
    description: 'Regular workshops on specific topics like kata, kumite, and karate philosophy. Open to all students.',
    icon: 'calendar-star',
  },
]

export function ProgramsSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Our Programs
        </Text>
      </View>
      {PROGRAMS.map((program) => {
        const isExpanded = expandedId === program.id
        return (
          <Card key={program.id} style={styles.card}>
            <TouchableOpacity
              onPress={() => toggleExpand(program.id)}
              activeOpacity={0.7}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.headerRow}>
                  <View style={styles.iconTitleRow}>
                    <MaterialCommunityIcons
                      name={program.icon as any}
                      size={32}
                      color="#7B2CBF"
                      style={styles.icon}
                    />
                    <Text variant="titleMedium" style={styles.programName}>
                      {program.name}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#6B7280"
                  />
                </View>
                {isExpanded && (
                  <Text variant="bodyMedium" style={styles.description}>
                    {program.description}
                  </Text>
                )}
              </Card.Content>
            </TouchableOpacity>
          </Card>
        )
      })}
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
    marginBottom: 12,
    elevation: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  programName: {
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  description: {
    marginTop: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
})

