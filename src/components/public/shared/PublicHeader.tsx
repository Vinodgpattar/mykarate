import React, { useState } from 'react'
import { View, StyleSheet, Image, TouchableOpacity, Platform, Dimensions } from 'react-native'
import { Text } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

interface PublicHeaderProps {
  logoUrl?: string | null
  dojoName?: string
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

export function PublicHeader({ 
  logoUrl, 
  dojoName = 'Karate Sports Club Hubballi',
}: PublicHeaderProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [imageError, setImageError] = useState(false)

  // Get logo URL from Supabase storage if not provided
  const getLogoUrl = () => {
    if (logoUrl) {
      console.log('PublicHeader: Using provided logo URL:', logoUrl)
      return logoUrl
    }
    
    // Default logo path in public-assets bucket (try .jpg first, then .png)
    const { data: jpgData } = supabase.storage
      .from('public-assets')
      .getPublicUrl('logo/dojo-logo.jpg')
    
    const url = jpgData?.publicUrl || null
    console.log('PublicHeader: Generated logo URL:', url)
    return url
  }

  const finalLogoUrl = getLogoUrl()

  const handleImageError = (error: any) => {
    console.error('PublicHeader: Image failed to load:', error)
    console.error('PublicHeader: Failed URL was:', finalLogoUrl)
    setImageError(true)
  }

  const handleImageLoad = () => {
    console.log('PublicHeader: Logo loaded successfully')
    setImageError(false)
  }

  const handleLoginPress = () => {
    router.push('/(auth)/login')
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8, paddingBottom: 10 }]}>
        <View style={styles.headerContent}>
          {/* Left Section: Logo and Title */}
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              {finalLogoUrl && !imageError ? (
                <Image
                  source={{ uri: finalLogoUrl }}
                  style={styles.logo}
                  resizeMode="contain"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              ) : (
                <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="karate" size={IS_MOBILE ? 36 : 40} color="#7B2CBF" />
                </View>
              )}
            </View>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.titleText} numberOfLines={2} ellipsizeMode="tail">
                {dojoName}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Sign In Button - Always Visible */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="login" size={IS_MOBILE ? 16 : 17} color="#FFFFFF" style={styles.loginIcon} />
              <Text variant="labelLarge" style={styles.loginButtonText}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    minWidth: 0, // Allows flex children to shrink
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: IS_MOBILE ? 64 : 72,
    height: IS_MOBILE ? 64 : 72,
    borderRadius: 10,
  },
  logoCircle: {
    width: IS_MOBILE ? 64 : 72,
    height: IS_MOBILE ? 64 : 72,
    borderRadius: IS_MOBILE ? 32 : 36,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    minWidth: 0, // Allows text to shrink if needed
  },
  titleText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: IS_MOBILE ? 18 : 20,
    letterSpacing: -0.3,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0, // Prevents button from shrinking
    marginLeft: 8, // Adds spacing from title
  },
  loginButton: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: IS_MOBILE ? 12 : 16,
    paddingVertical: IS_MOBILE ? 6 : 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loginIcon: {
    marginRight: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: IS_MOBILE ? 12 : 13,
  },
})

