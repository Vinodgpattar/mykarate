import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

interface AdminHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBackPress?: () => void
}

export function AdminHeader({
  title = 'Karate Sports Club Hubballi',
  subtitle,
  showBackButton = false,
  onBackPress,
}: AdminHeaderProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

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

  const handleNotificationsPress = () => {
    router.push('/(admin)/(tabs)/notifications')
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
            onPress={handleNotificationsPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#111827" />
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
  },
})
