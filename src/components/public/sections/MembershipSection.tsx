import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface MembershipSectionProps {
  onViewDetailsPress: () => void
}

export function MembershipSection({ onViewDetailsPress }: MembershipSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Membership & Fees
        </Text>
      </View>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.feeRow}>
            <Text variant="bodyLarge" style={styles.feeLabel}>
              Admission + Dress
            </Text>
            <Text variant="headlineSmall" style={styles.feeAmount}>
              ₹2,000
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text variant="bodyLarge" style={styles.feeLabel}>
              Monthly Fee
            </Text>
            <Text variant="headlineSmall" style={styles.feeAmount}>
              ₹600
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text variant="bodyLarge" style={styles.feeLabel}>
              Yearly Fee
            </Text>
            <Text variant="headlineSmall" style={styles.feeAmount}>
              ₹6,600
            </Text>
          </View>
          <Button
            mode="outlined"
            onPress={onViewDetailsPress}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="chevron-right"
          >
            View All Fees
          </Button>
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
    elevation: 2,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 24,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  feeLabel: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  feeAmount: {
    fontWeight: 'bold',
    color: '#7B2CBF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  button: {
    marginTop: 16,
    borderColor: '#7B2CBF',
  },
  buttonContent: {
    paddingVertical: 8,
  },
})

