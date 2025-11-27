import { View, StyleSheet, Animated } from 'react-native'
import { Card } from 'react-native-paper'
import { useEffect, useRef } from 'react'
import { COLORS, RADIUS, SPACING } from '@/lib/design-system'

interface SkeletonLoaderProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonLoaderProps) {
  const fadeAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [fadeAnim])

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: COLORS.borderLight,
          opacity: fadeAnim,
        },
        style,
      ]}
    />
  )
}

export function StatBadgeSkeleton() {
  return (
    <View style={styles.badge}>
      <SkeletonLoader width={36} height={36} borderRadius={8} style={styles.icon} />
      <View style={styles.content}>
        <SkeletonLoader width={40} height={20} style={styles.number} />
        <SkeletonLoader width={50} height={12} style={styles.label} />
      </View>
    </View>
  )
}

export function OverviewStatsSkeleton() {
  return (
    <View style={styles.container}>
      <StatBadgeSkeleton />
      <StatBadgeSkeleton />
      <StatBadgeSkeleton />
      <StatBadgeSkeleton />
      <StatBadgeSkeleton />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flex: 1,
    minWidth: '30%',
    maxWidth: '48%',
    gap: 10,
  },
  content: {
    flex: 1,
  },
  icon: {
    // Icon skeleton
  },
  number: {
    marginBottom: 4,
  },
  label: {
    // Label skeleton
  },
})


