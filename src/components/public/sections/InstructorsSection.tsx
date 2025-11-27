import { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { Text, Card, Chip } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { Instructor } from '@/lib/public/types/public.types'

interface InstructorsSectionProps {
  instructors: Instructor[]
  onInstructorPress: (instructor: Instructor) => void
}

export function InstructorsSection({ instructors, onInstructorPress }: InstructorsSectionProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  
  const featuredInstructors = instructors.filter(inst => inst.is_featured).slice(0, 4)

  if (featuredInstructors.length === 0) {
    return null
  }

  const handleImageError = (instructorId: string) => {
    setImageErrors(prev => new Set(prev).add(instructorId))
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Featured Instructors
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {featuredInstructors.map((instructor) => {
          const isPradeep = instructor.name.toLowerCase().includes('pradeep')
          return (
            <TouchableOpacity
              key={instructor.id}
              onPress={() => onInstructorPress(instructor)}
              activeOpacity={0.8}
            >
              <Card style={[styles.card, isPradeep && styles.pradeepCard]}>
                <Card.Content style={styles.cardContent}>
                  {instructor.profile_image_url && !imageErrors.has(instructor.id) ? (
                    <View style={styles.imageFrame}>
                      <Image
                        source={{ uri: instructor.profile_image_url }}
                        style={styles.image}
                        resizeMode="contain"
                        onError={() => handleImageError(instructor.id)}
                      />
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialCommunityIcons name="account" size={48} color="#9CA3AF" />
                    </View>
                  )}
                  {isPradeep && (
                    <Chip
                      mode="flat"
                      icon="medal"
                      style={styles.pradeepChip}
                      textStyle={styles.pradeepChipText}
                    >
                      Founder&apos;s Master
                    </Chip>
                  )}
                  <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                    {instructor.name}
                  </Text>
                  {instructor.belt_rank && (
                    <Text variant="bodySmall" style={styles.rank}>
                      {instructor.belt_rank}
                    </Text>
                  )}
                  {instructor.title && (
                    <Text variant="bodySmall" style={styles.instructorTitle}>
                      {instructor.title}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: 200,
    marginRight: 16,
    elevation: 2,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  imageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  rank: {
    color: '#7B2CBF',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  instructorTitle: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 12,
  },
  pradeepCard: {
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  pradeepChip: {
    marginBottom: 6,
    backgroundColor: '#FEF9C3',
  },
  pradeepChipText: {
    color: '#92400E',
    fontWeight: '600',
  },
})

