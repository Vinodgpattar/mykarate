import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface Stat {
  value: string
  label: string
  icon: string
}

interface QuickStatsSectionProps {
  studentCount: number
  branchCount: number
  yearsInOperation?: number
}

export function QuickStatsSection({ studentCount, branchCount, yearsInOperation = 10 }: QuickStatsSectionProps) {
  const stats: Stat[] = [
    {
      value: `${studentCount}+`,
      label: 'Students',
      icon: 'account-group',
    },
    {
      value: `${branchCount}`,
      label: 'Branches',
      icon: 'office-building',
    },
    {
      value: `${yearsInOperation}+`,
      label: 'Years',
      icon: 'calendar-clock',
    },
  ]

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stats.map((stat, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons
                name={stat.icon as any}
                size={32}
                color="#7B2CBF"
                style={styles.icon}
              />
              <Text variant="headlineMedium" style={styles.value}>
                {stat.value}
              </Text>
              <Text variant="bodySmall" style={styles.label}>
                {stat.label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 120,
    marginRight: 12,
    elevation: 2,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  icon: {
    marginBottom: 12,
  },
  value: {
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  label: {
    color: '#6B7280',
    textAlign: 'center',
  },
})

