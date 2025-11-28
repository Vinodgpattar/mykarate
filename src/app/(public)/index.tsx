/**
 * Public Homepage - Redesigned Version
 * Version: 3.0 - Using new component sections
 * Updated: 2025-01-28
 * New design with HeroSection, FeaturedInstructorsSection, and SlidableGallerySection
 */
import { useState } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Text, Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePublicData } from '@/lib/public/hooks/usePublicData'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { HeroSection } from '@/components/public/sections/HeroSection'
import { FeaturedInstructorsSection } from '@/components/public/sections/FeaturedInstructorsSection'
import { SlidableGallerySection } from '@/components/public/sections/SlidableGallerySection'
import { PradeepLegacySection } from '@/components/public/sections/PradeepLegacySection'
import { LocationsSection } from '@/components/public/sections/LocationsSection'
import { InstructorDetailModal } from '@/components/public/modals/InstructorDetailModal'
import type { Instructor, PublicGalleryItem } from '@/lib/public/types/public.types'

export default function PublicHomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, loading, error } = usePublicData()
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<PublicGalleryItem | null>(null)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  // Get hero image from Pradeep Kumar instructor or first instructor
  const heroImageUrl =
    data?.instructors.find((inst) => inst.name.toLowerCase().includes('pradeep'))
      ?.profile_image_url || data?.instructors[0]?.profile_image_url

  // Get dojo name from first branch
  const dojoName = data?.branches[0]?.name || 'SHOTOKAN KARATE-DO YOUTH SPORTS CLUB® HUBBALLI'

  const handleInstructorPress = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
  }

  const handleGalleryItemPress = (item: PublicGalleryItem) => {
    setSelectedGalleryItem(item)
    // Navigate to gallery screen
    router.push('/(public)/gallery')
  }

  const handleViewAllGallery = () => {
    // Navigate to full gallery screen
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
        <Text variant="titleLarge" style={styles.errorTitle}>
          Unable to load content
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error?.message || 'Please try again later'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <PublicHeader logoUrl={data.logoUrl} dojoName={dojoName} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* NEW HERO SECTION - Full screen with image background */}
        <HeroSection
          heroImageUrl={heroImageUrl}
          dojoName={dojoName}
          tagline="Master Your Mind, Body & Spirit"
          studentCount={data.studentCount}
          branchCount={data.branches.length}
          yearsInOperation={10}
        />

        {/* LEGACY – SHIHAN PRADEEP KUMAR */}
        <PradeepLegacySection instructors={data.instructors} />

        {/* NEW GALLERY SECTION - Horizontal scrollable */}
        <SlidableGallerySection
          galleryItems={data.galleryItems}
          onViewAllPress={handleViewAllGallery}
          onItemPress={handleGalleryItemPress}
        />

        {/* NEW FEATURED INSTRUCTORS SECTION - Horizontal scrollable */}
        <FeaturedInstructorsSection instructors={data.instructors} />

        {/* LOCATIONS MAP-STYLE LIST */}
        <LocationsSection branches={data.branches} />
      </ScrollView>

      {/* Modals */}
      <InstructorDetailModal
        instructor={selectedInstructor}
        visible={selectedInstructor !== null}
        onClose={() => setSelectedInstructor(null)}
      />

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
  },
})
