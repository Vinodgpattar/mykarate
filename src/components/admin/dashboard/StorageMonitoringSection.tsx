import { View, StyleSheet } from 'react-native'
import { Text, Card, ProgressBar, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState, useEffect } from 'react'
import { getStorageSummary, formatBytes, type StorageSummary } from '@/lib/storage-monitoring'
import { COLORS, SPACING, RADIUS } from '@/lib/design-system'

export function StorageMonitoringSection() {
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStorageSummary()
  }, [])

  const loadStorageSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const summary = await getStorageSummary()
      if (summary) {
        setStorageSummary(summary)
      } else {
        setError('Failed to load storage information')
      }
    } catch (err) {
      setError('Error loading storage information')
      console.error('Error loading storage summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons name="database" size={24} color={COLORS.primary} />
            <Text variant="titleMedium" style={styles.title}>
              Storage Usage
            </Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text variant="bodySmall" style={styles.loadingText}>
              Loading storage information...
            </Text>
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (error || !storageSummary) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons name="database" size={24} color={COLORS.primary} />
            <Text variant="titleMedium" style={styles.title}>
              Storage Usage
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.errorText}>
            {error || 'Unable to load storage information'}
          </Text>
        </Card.Content>
      </Card>
    )
  }

  const getStatusColor = () => {
    switch (storageSummary.status) {
      case 'critical':
        return '#EF4444' // Red
      case 'warning':
        return '#F59E0B' // Orange
      default:
        return '#10B981' // Green
    }
  }

  const getStatusIcon = () => {
    switch (storageSummary.status) {
      case 'critical':
        return 'alert-circle'
      case 'warning':
        return 'alert'
      default:
        return 'check-circle'
    }
  }

  const getStatusText = () => {
    switch (storageSummary.status) {
      case 'critical':
        return 'Critical - Consider upgrading'
      case 'warning':
        return 'Warning - Monitor closely'
      default:
        return 'Healthy'
    }
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="database" size={24} color={COLORS.primary} />
          <Text variant="titleMedium" style={styles.title}>
            Storage Usage
          </Text>
        </View>

        {/* Overall Usage */}
        <View style={styles.overallSection}>
          <View style={styles.usageRow}>
            <View style={styles.usageInfo}>
              <Text variant="headlineSmall" style={styles.usageValue}>
                {storageSummary.totalSizeMB.toFixed(1)} MB
              </Text>
              <Text variant="bodySmall" style={styles.usageLabel}>
                of {storageSummary.freeTierLimit / (1024 * 1024)} MB used
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
              <MaterialCommunityIcons
                name={getStatusIcon()}
                size={16}
                color={getStatusColor()}
              />
              <Text variant="bodySmall" style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <ProgressBar
            progress={storageSummary.usagePercentage / 100}
            color={getStatusColor()}
            style={styles.progressBar}
          />

          <View style={styles.progressInfo}>
            <Text variant="bodySmall" style={styles.progressText}>
              {storageSummary.usagePercentage.toFixed(1)}% used
            </Text>
            <Text variant="bodySmall" style={styles.progressText}>
              {storageSummary.remainingSpaceMB.toFixed(1)} MB remaining
            </Text>
          </View>
        </View>

        {/* Bucket Breakdown */}
        {storageSummary.buckets.length > 0 && (
          <View style={styles.bucketsSection}>
            <Text variant="bodyMedium" style={styles.bucketsTitle}>
              Storage by Bucket
            </Text>
            {storageSummary.buckets.map((bucket) => (
              <View key={bucket.bucketId} style={styles.bucketItem}>
                <View style={styles.bucketHeader}>
                  <Text variant="bodyMedium" style={styles.bucketName}>
                    {bucket.bucketName}
                  </Text>
                  <Text variant="bodySmall" style={styles.bucketSize}>
                    {formatBytes(bucket.totalSize)}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.bucketFiles}>
                  {bucket.fileCount} file{bucket.fileCount !== 1 ? 's' : ''} •{' '}
                  {bucket.percentageOfLimit?.toFixed(1) || '0'}% of total
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="file-multiple" size={18} color={COLORS.textSecondary} />
            <Text variant="bodySmall" style={styles.summaryText}>
              {storageSummary.totalFiles} total files
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="harddisk" size={18} color={COLORS.textSecondary} />
            <Text variant="bodySmall" style={styles.summaryText}>
              {storageSummary.buckets.length} bucket{storageSummary.buckets.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#fff',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
  },
  errorText: {
    color: COLORS.error,
    paddingVertical: SPACING.sm,
  },
  overallSection: {
    marginBottom: SPACING.md,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  usageInfo: {
    flex: 1,
  },
  usageValue: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  usageLabel: {
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 11,
  },
  progressBar: {
    height: 8,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  bucketsSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bucketsTitle: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  bucketItem: {
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  bucketName: {
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  bucketSize: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bucketFiles: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
})

