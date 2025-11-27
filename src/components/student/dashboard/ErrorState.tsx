import { View, StyleSheet } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS, SPACING } from '@/lib/design-system'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Failed to load dashboard data', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
      <Text variant="titleMedium" style={styles.errorTitle}>
        {message}
      </Text>
      <Text variant="bodyMedium" style={styles.errorText}>
        Please check your connection and try again.
      </Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.retryButton}
          buttonColor={COLORS.brandPurple}
          icon="refresh"
        >
          Retry
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 200,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    marginTop: SPACING.md,
  },
})


