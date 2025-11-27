import { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator, Modal, TouchableOpacity, Image, Dimensions } from 'react-native'
import { Text, Card, Button, Chip, Divider, List, Snackbar, IconButton } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import ImageViewing from 'react-native-image-viewing'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768
import { usePublicData } from '@/lib/public/hooks/usePublicData'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { logger } from '@/lib/logger'
import { LocationsSection } from '@/components/public/sections/LocationsSection'
import { SlidableGallerySection } from '@/components/public/sections/SlidableGallerySection'
import { ChiefInstructorSection } from '@/components/public/sections/ChiefInstructorSection'
import { FeaturedInstructorsSection } from '@/components/public/sections/FeaturedInstructorsSection'
import type { PublicGalleryItem } from '@/lib/public/types/public.types'

export default function PublicHomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, loading, error, refetch } = usePublicData()
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<PublicGalleryItem | null>(null)
  const [galleryViewerVisible, setGalleryViewerVisible] = useState(false)
  const [galleryViewerIndex, setGalleryViewerIndex] = useState(0)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  // Calculate years since establishment (2010)
  const yearsSinceEstablishment = useMemo(() => {
    const establishmentYear = 2010
    const currentYear = new Date().getFullYear()
    return currentYear - establishmentYear
  }, [])

  // Safe branch access
  const firstBranch = useMemo(() => {
    return data?.branches && data.branches.length > 0 ? data.branches[0] : null
  }, [data?.branches])

  // Get dojo name from first branch with safe fallback
  const dojoName = firstBranch?.name || 'Karate Sports Club Hubballi'

  // Get Pradeep instructor for hero section
  const pradeepInstructor = useMemo(() => {
    if (!data?.instructors || data.instructors.length === 0) return null
    return data.instructors.find((inst) => 
      inst.name.toLowerCase().includes('pradeep')
    ) || null
  }, [data?.instructors])

  // Get Chief Instructor Rajesh B. Yaragatti
  const chiefInstructor = useMemo(() => {
    if (!data?.instructors || data.instructors.length === 0) return null
    return data.instructors.find((inst) => 
      inst.name.toLowerCase().includes('rajesh') || 
      inst.name.toLowerCase().includes('yaragatti')
    ) || null
  }, [data?.instructors])

  // Prepare gallery images for viewer
  const galleryImages = useMemo(() => {
    if (!data?.galleryItems || data.galleryItems.length === 0) return []
    return data.galleryItems
      .filter(item => item.media_type === 'image')
      .map(item => ({ uri: item.file_url }))
  }, [data?.galleryItems])

  const handleGalleryItemPress = (item: PublicGalleryItem) => {
    if (item.media_type === 'image') {
      // Find index of this item in the gallery
      const index = data?.galleryItems
        ?.filter(i => i.media_type === 'image')
        .findIndex(i => i.id === item.id) ?? 0
      setGalleryViewerIndex(Math.max(0, index))
      setGalleryViewerVisible(true)
    } else {
      // For videos, show a message
      setSnackbar({ visible: true, message: 'Video playback coming soon' })
    }
  }

  const handleViewAllGallery = () => {
    router.push('/(public)/gallery')
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#DC2626" />
        <Text variant="titleLarge" style={styles.errorTitle}>
          Unable to load content
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error?.message || 'Please try again later'}
        </Text>
        <Button
          mode="contained"
          onPress={refetch}
          style={styles.retryButton}
          buttonColor="#7B2CBF"
        >
          Retry
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header (previous design) */}
      <PublicHeader logoUrl={data.logoUrl} dojoName={dojoName} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION - Tribute to Shihan Pradeep Kumar */}
        <Card style={styles.heroCard} mode="elevated">
          <View style={styles.heroContent}>
            {/* Mobile: Image first, Desktop: Image on right */}
            {IS_MOBILE && (
              <View style={styles.heroRight}>
                {pradeepInstructor?.profile_image_url ? (
                  <View style={styles.imageFrame}>
                    <Image
                      source={{ uri: pradeepInstructor.profile_image_url }}
                      style={styles.heroImage}
                      resizeMode="contain"
                      onError={() => {
                        logger.warn('Hero image failed to load', { url: pradeepInstructor.profile_image_url })
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="karate" size={IS_MOBILE ? 80 : 100} color="#9CA3AF" />
                    <Text variant="bodyMedium" style={styles.placeholderText}>
                      Shihan Pradeep Kumar
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Left Side - Tribute Content */}
            <View style={styles.heroLeft}>
              {/* Header Section: Badge + Name + Rank */}
              <View style={styles.headerSection}>
                <Chip
                  mode="flat"
                  icon="medal"
                  style={styles.memoryBadge}
                  textStyle={styles.memoryBadgeText}
                >
                  In Memory Of
                </Chip>
                
                <Text variant="headlineLarge" style={styles.heroTitle}>
                  {pradeepInstructor?.name || 'Shihan Pradeep Kumar'}
                </Text>
                
                {pradeepInstructor?.belt_rank && (
                  <Text variant="titleLarge" style={styles.heroRank}>
                    {pradeepInstructor.belt_rank}
                  </Text>
                )}
              </View>
              
              {/* Divider */}
              <View style={styles.divider} />
              
              {/* Main Content: Tribute Text */}
              <Text variant="bodyLarge" style={styles.heroTribute}>
                Late Shihan Pradeep Kumar was the guiding pillar of our dojo. His discipline,
                humility, and deep understanding of Shotokan Karate shaped the training philosophy
                we follow today. We honour his legacy in every bow, every technique, and every class.
              </Text>
              
              {/* Quote Section */}
              <View style={styles.quoteContainer}>
                <MaterialCommunityIcons
                  name="format-quote-open"
                  size={28}
                  color="#7B2CBF"
                  style={styles.quoteIcon}
                />
                <Text variant="bodyLarge" style={styles.heroQuote}>
                  &quot;Karate is not about fighting others, it is about fighting your own limits.&quot;
                </Text>
              </View>
              
              {/* Founder Badge */}
              <Chip
                mode="flat"
                icon="star"
                style={styles.founderBadge}
                textStyle={styles.founderBadgeText}
              >
                Founder&apos;s Master
              </Chip>
              
              {/* Call-to-Action Buttons */}
              <View style={styles.heroButtons}>
                <Button
                  mode="contained"
                  onPress={() => router.push('/(public)/locations')}
                  style={styles.primaryButton}
                  contentStyle={styles.primaryButtonContent}
                  labelStyle={styles.primaryButtonLabel}
                  buttonColor="#7B2CBF"
                  textColor="#FFFFFF"
                >
                  Join Now
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => router.push('/(public)/programs')}
                  style={styles.secondaryButton}
                  contentStyle={styles.secondaryButtonContent}
                  labelStyle={styles.secondaryButtonLabel}
                  textColor="#7B2CBF"
                >
                  View Programs
                </Button>
              </View>
            </View>
            
            {/* Desktop: Image on right */}
            {!IS_MOBILE && (
              <View style={styles.heroRight}>
                {pradeepInstructor?.profile_image_url ? (
                  <View style={styles.imageFrame}>
                    <Image
                      source={{ uri: pradeepInstructor.profile_image_url }}
                      style={styles.heroImage}
                      resizeMode="contain"
                      onError={() => {
                        logger.warn('Hero image failed to load', { url: pradeepInstructor.profile_image_url })
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="karate" size={IS_MOBILE ? 80 : 100} color="#9CA3AF" />
                    <Text variant="bodyMedium" style={styles.placeholderText}>
                      Shihan Pradeep Kumar
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Card>

        {/* SLIDABLE GALLERY SECTION */}
        <SlidableGallerySection
          galleryItems={data.galleryItems}
          onViewAllPress={handleViewAllGallery}
          onItemPress={handleGalleryItemPress}
        />

        {/* HIGHLIGHTS */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Highlights
          </Text>
          <View style={styles.chipRow}>
            <Chip
              mode="flat"
              icon="shield-check"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              Certified Instructors
            </Chip>
            <Chip
              mode="flat"
              icon="medal"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              Traditional Shotokan
            </Chip>
            <Chip
              mode="flat"
              icon="clock-outline"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              Flexible Timings
            </Chip>
          </View>
        </View>

        {/* CHIEF INSTRUCTOR - RAJESH B. YARAGATTI */}
        <ChiefInstructorSection instructor={chiefInstructor} />

        {/* FEATURED INSTRUCTORS */}
        <FeaturedInstructorsSection instructors={data.instructors} />

        {/* LOCATIONS & CONTACT */}
        {firstBranch && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Find Our Dojo
            </Text>
            <Card mode="outlined" style={styles.infoCard}>
              <Card.Content>
                <List.Item
                  title={dojoName}
                  description={firstBranch.address || 'Hubballi, Karnataka'}
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                />
                {firstBranch.phone && (
                  <>
                    <Divider style={styles.cardDivider} />
                    <List.Item
                      title={firstBranch.phone}
                      description="Call us for timings and fee details"
                      left={(props) => <List.Icon {...props} icon="phone" />}
                    />
                  </>
                )}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* LOCATIONS MAP-STYLE LIST */}
        <LocationsSection branches={data.branches} />
      </ScrollView>

      {/* Gallery Viewer */}
      {galleryImages.length > 0 && (
        <ImageViewing
          images={galleryImages}
          imageIndex={galleryViewerIndex}
          visible={galleryViewerVisible}
          onRequestClose={() => setGalleryViewerVisible(false)}
          presentationStyle="overFullScreen"
        />
      )}

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={2000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorTitle: {
    marginBottom: 8,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 24,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  heroContent: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    padding: IS_MOBILE ? 16 : 24,
    gap: IS_MOBILE ? 16 : 24,
    minHeight: IS_MOBILE ? 0 : 400,
  },
  heroLeft: {
    flex: 1,
    justifyContent: 'center',
    gap: IS_MOBILE ? 12 : 16,
    minWidth: 0, // Allow flex shrink
  },
  headerSection: {
    gap: IS_MOBILE ? 6 : 8,
  },
  heroRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0, // Allow flex shrink
    width: IS_MOBILE ? '100%' : 'auto',
  },
  memoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
  },
  memoryBadgeText: {
    color: '#7B2CBF',
    fontWeight: '600',
    fontSize: 11,
  },
  heroTitle: {
    color: '#111827',
    fontWeight: '800',
    lineHeight: IS_MOBILE ? 36 : 44,
    fontSize: IS_MOBILE ? 28 : 32,
    letterSpacing: -0.5,
  },
  heroRank: {
    color: '#7B2CBF',
    fontWeight: '600',
    fontSize: IS_MOBILE ? 18 : 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: IS_MOBILE ? 8 : 12,
  },
  founderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
  },
  founderBadgeText: {
    color: '#4C1D95',
    fontWeight: '600',
    fontSize: 12,
  },
  heroTribute: {
    color: '#374151',
    lineHeight: IS_MOBILE ? 24 : 26,
    fontSize: IS_MOBILE ? 16 : 17,
  },
  quoteContainer: {
    flexDirection: 'column',
    backgroundColor: '#F9FAFB',
    padding: IS_MOBILE ? 16 : 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7B2CBF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quoteIcon: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  heroQuote: {
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: IS_MOBILE ? 22 : 24,
    fontSize: IS_MOBILE ? 15 : 16,
  },
  heroButtons: {
    flexDirection: IS_MOBILE ? 'column' : 'row',
    gap: IS_MOBILE ? 8 : 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: 24,
    flex: IS_MOBILE ? 0 : 1,
    minWidth: IS_MOBILE ? '100%' : 140,
  },
  primaryButtonContent: {
    paddingVertical: 10,
  },
  primaryButtonLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    borderRadius: 24,
    borderColor: '#7B2CBF',
    flex: IS_MOBILE ? 0 : 1,
    minWidth: IS_MOBILE ? '100%' : 140,
  },
  secondaryButtonContent: {
    paddingVertical: 8,
  },
  secondaryButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  imageFrame: {
    width: '100%',
    maxWidth: IS_MOBILE ? '100%' : 400,
    aspectRatio: IS_MOBILE ? 2/3 : 4/5,
    borderRadius: IS_MOBILE ? 12 : 16,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    borderWidth: IS_MOBILE ? 3 : 4,
    borderColor: '#7B2CBF',
    padding: 0,
    elevation: 4,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: IS_MOBILE ? 9 : 12,
  },
  imageOverlay: {
    // Removed overlay for cleaner, more respectful appearance
  },
  imagePlaceholder: {
    width: '100%',
    maxWidth: IS_MOBILE ? '100%' : 400,
    aspectRatio: IS_MOBILE ? 2/3 : 4/5,
    borderRadius: IS_MOBILE ? 12 : 16,
    backgroundColor: '#F9FAFB',
    borderWidth: IS_MOBILE ? 3 : 4,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: '#6B7280',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    color: '#4C1D95',
    fontWeight: '500',
  },
  infoCard: {
    marginTop: 12,
  },
  cardDivider: {
    marginVertical: 4,
  },
})
