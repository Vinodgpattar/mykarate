import { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, ImageBackground } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'

interface HeroSectionProps {
  heroImageUrl?: string | null
  dojoName?: string
  tagline?: string
  studentCount?: number
  branchCount?: number
  yearsInOperation?: number
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

export function HeroSection({
  heroImageUrl,
  dojoName = 'SHOTOKAN KARATE-DO YOUTH SPORTS CLUB® HUBBALLI',
  tagline = 'Master Your Mind, Body & Spirit',
  studentCount = 0,
  branchCount = 0,
  yearsInOperation = 10,
}: HeroSectionProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleJoinNow = () => {
    router.push('/(public)/locations')
  }

  const handleVisitDojo = () => {
    router.push('/(public)/locations')
  }

  return (
    <View style={styles.container}>
      {heroImageUrl ? (
        <ImageBackground
          source={{ uri: heroImageUrl }}
          style={styles.backgroundImage}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)'] as [string, string, string]}
            style={styles.gradient}
          >
            <View style={[styles.content, { paddingTop: insets.top + (IS_MOBILE ? 40 : 80), paddingBottom: insets.bottom + 40 }]}>
              <Animated.View
                style={[
                  styles.textContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Main Headline - Nova Library Style */}
                <Text variant="displayLarge" style={styles.headline}>
                  Master. Train. Excel.
                </Text>

                {/* Subtitle */}
                <Text variant="titleLarge" style={styles.subtitle}>
                  {tagline}
                </Text>

                {/* Location/Description */}
                <Text variant="bodyLarge" style={styles.description}>
                  Hubballi's premier Shotokan Karate Dojo. A disciplined, traditional training environment designed for students who want to achieve excellence.
                </Text>

                {/* CTA Buttons */}
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleJoinNow}
                    style={styles.primaryButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.primaryButtonLabel}
                    buttonColor="#FFFFFF"
                    textColor="#7B2CBF"
                  >
                    Join Now
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleVisitDojo}
                    style={styles.secondaryButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.secondaryButtonLabel}
                    textColor="#FFFFFF"
                  >
                    Visit Dojo
                  </Button>
                </View>
              </Animated.View>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={['#7B2CBF', '#9D4EDD', '#7B2CBF'] as [string, string, string]}
          style={styles.fallbackBackground}
        >
          <View style={[styles.content, { paddingTop: insets.top + (IS_MOBILE ? 40 : 80), paddingBottom: insets.bottom + 40 }]}>
            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text variant="displayLarge" style={styles.headline}>
                Master. Train. Excel.
              </Text>
              <Text variant="titleLarge" style={styles.subtitle}>
                {tagline}
              </Text>
              <Text variant="bodyLarge" style={styles.description}>
                Hubballi's premier Shotokan Karate Dojo. A disciplined, traditional training environment designed for students who want to achieve excellence.
              </Text>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleJoinNow}
                  style={styles.primaryButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.primaryButtonLabel}
                  buttonColor="#FFFFFF"
                  textColor="#7B2CBF"
                >
                  Join Now
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleVisitDojo}
                  style={styles.secondaryButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.secondaryButtonLabel}
                  textColor="#FFFFFF"
                >
                  Visit Dojo
                </Button>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: IS_MOBILE ? 500 : 600,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    minHeight: IS_MOBILE ? 500 : 600,
    justifyContent: 'flex-end',
  },
  gradient: {
    width: '100%',
    minHeight: IS_MOBILE ? 500 : 600,
    justifyContent: 'flex-end',
  },
  fallbackBackground: {
    width: '100%',
    minHeight: IS_MOBILE ? 500 : 600,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: IS_MOBILE ? 24 : 48,
    paddingBottom: IS_MOBILE ? 40 : 60,
  },
  textContainer: {
    alignItems: IS_MOBILE ? 'flex-start' : 'center',
    maxWidth: IS_MOBILE ? '100%' : 800,
    alignSelf: IS_MOBILE ? 'flex-start' : 'center',
  },
  headline: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: IS_MOBILE ? 36 : 56,
    lineHeight: IS_MOBILE ? 44 : 64,
    marginBottom: IS_MOBILE ? 12 : 16,
    textAlign: IS_MOBILE ? 'left' : 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: IS_MOBILE ? 20 : 28,
    lineHeight: IS_MOBILE ? 28 : 36,
    marginBottom: IS_MOBILE ? 16 : 20,
    textAlign: IS_MOBILE ? 'left' : 'center',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#FFFFFF',
    fontSize: IS_MOBILE ? 15 : 18,
    lineHeight: IS_MOBILE ? 22 : 26,
    marginBottom: IS_MOBILE ? 32 : 40,
    textAlign: IS_MOBILE ? 'left' : 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    gap: IS_MOBILE ? 12 : 16,
    width: IS_MOBILE ? '100%' : 'auto',
  },
  primaryButton: {
    flex: IS_MOBILE ? 0 : 1,
    minWidth: IS_MOBILE ? '100%' : 180,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  secondaryButton: {
    flex: IS_MOBILE ? 0 : 1,
    minWidth: IS_MOBILE ? '100%' : 180,
    borderRadius: 28,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  buttonContent: {
    paddingVertical: IS_MOBILE ? 12 : 14,
  },
  primaryButtonLabel: {
    fontSize: IS_MOBILE ? 16 : 18,
    fontWeight: '600',
  },
  secondaryButtonLabel: {
    fontSize: IS_MOBILE ? 16 : 18,
    fontWeight: '600',
  },
})
