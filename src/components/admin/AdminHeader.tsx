import React, { useState, useCallback, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { getPendingInformsCount } from '@/lib/student-leave-informs'

interface AdminHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBackPress?: () => void
  pendingInformsCount?: number
}

export function AdminHeader({
  title = 'Karate Sports Club Hubballi',
  subtitle,
  showBackButton = false,
  onBackPress,
  pendingInformsCount: propPendingInformsCount,
}: AdminHeaderProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [pendingInformsCount, setPendingInformsCount] = useState(propPendingInformsCount ?? 0)
  const lastLoadTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)

  // If count is not provided as prop, fetch it ourselves
  const loadPendingCount = useCallback(async () => {
    // If count is provided as prop, use it and don't fetch
    if (propPendingInformsCount !== undefined) {
      setPendingInformsCount(propPendingInformsCount)
      return
    }

    // Prevent too frequent refreshes
    const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current
    if (isLoadingRef.current || timeSinceLastLoad < 500) {
      return
    }

    isLoadingRef.current = true
    try {
      const result = await getPendingInformsCount()
      if (!result.error) {
        setPendingInformsCount(result.count)
        lastLoadTimeRef.current = Date.now()
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [propPendingInformsCount])

  // Update count when prop changes
  React.useEffect(() => {
    if (propPendingInformsCount !== undefined) {
      setPendingInformsCount(propPendingInformsCount)
    }
  }, [propPendingInformsCount])

  // Refresh count when screen comes into focus (only if not provided as prop)
  useFocusEffect(
    useCallback(() => {
      if (propPendingInformsCount === undefined) {
        loadPendingCount()
      }
    }, [loadPendingCount, propPendingInformsCount])
  )

  const getLogoUrl = () => {
    // Try to get logo from Supabase storage (same as splash screen)
    const { data } = supabase.storage
      .from('public-assets')
      .getPublicUrl('logo/dojo-logo.jpg')
    return data?.publicUrl || null
  }

  const logoUrl = getLogoUrl()

  const handleBack = () => {
    if (onBackPress) {
      onBackPress()
      return
    }
    router.back()
  }

  const handleStudentInformsPress = () => {
    router.push('/(admin)/(tabs)/student-informs')
  }

  const handleAccountPress = () => {
    router.push('/(admin)/(tabs)/account-settings')
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoContainer}>
              {logoUrl && !imageError ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={styles.logo}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="karate" size={32} color="#7B2CBF" />
                </View>
              )}
            </View>
          )}
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="bodySmall" style={styles.subtitleText} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleStudentInformsPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="calendar-alert" size={24} color="#111827" />
            {pendingInformsCount !== undefined && pendingInformsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingInformsCount > 99 ? '99+' : pendingInformsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAccountPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-circle" size={26} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  logoContainer: {
    marginRight: 14,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: '#6B7280',
    marginTop: 2,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
})
