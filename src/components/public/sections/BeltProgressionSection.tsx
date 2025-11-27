import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { BELT_LEVELS, BELT_COLORS, BELT_KYU } from '@/lib/belts'

export function BeltProgressionSection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Belt Progression
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BELT_LEVELS.map((belt, index) => {
          const beltColor = BELT_COLORS[belt] || '#FFFFFF'
          const kyu = BELT_KYU[belt] || ''
          const isLightColor = belt === 'White' || belt === 'Yellow'
          
          return (
            <Card
              key={belt}
              style={[
                styles.beltCard,
                { backgroundColor: beltColor },
                index === 0 && styles.firstCard,
                index === BELT_LEVELS.length - 1 && styles.lastCard,
              ]}
            >
              <Card.Content style={styles.beltCardContent}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.beltName,
                    { color: isLightColor ? '#000000' : '#FFFFFF' },
                  ]}
                >
                  {belt}
                </Text>
                {kyu && (
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.kyu,
                      { color: isLightColor ? '#000000' : '#FFFFFF' },
                    ]}
                  >
                    {kyu}
                  </Text>
                )}
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
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  beltCard: {
    width: 100,
    height: 120,
    marginRight: 12,
    elevation: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 16,
  },
  beltCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  beltName: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  kyu: {
    textAlign: 'center',
    fontSize: 11,
  },
})

