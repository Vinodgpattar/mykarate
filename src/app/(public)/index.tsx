/**
 * Public Homepage - Redesigned Version
 * Version: 2.0
 * Updated: 2025-01-28
 * Cache-busting identifier to ensure latest version is bundled
 */
import { useState } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Text, Card, Button, Chip, Divider, List, Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePublicData } from '@/lib/public/hooks/usePublicData'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { InstructorsSection } from '@/components/public/sections/InstructorsSection'
import { LocationsSection } from '@/components/public/sections/LocationsSection'
import { GallerySection } from '@/components/public/sections/GallerySection'
import { PradeepLegacySection } from '@/components/public/sections/PradeepLegacySection'
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
    // TODO: Open gallery viewer
    setSnackbar({ visible: true, message: 'Opening gallery viewer...' })
  }

  const handleViewAllGallery = () => {
    // TODO: Navigate to full gallery screen
    setSnackbar({ visible: true, message: 'Opening full gallery...' })
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
      {/* Header (previous design) */}
      <PublicHeader logoUrl={data.logoUrl} dojoName={dojoName} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION */}
        <Card style={styles.heroCard} mode="elevated">
          <LinearGradient
            colors={['#7B2CBF', '#9D4EDD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroTextContainer}>
                <Text variant="labelSmall" style={styles.heroBadge}>
                  Hubballi • Traditional Shotokan Karate • Est. 2010
                </Text>
                <Text variant="displaySmall" style={styles.heroTitle}>
                  Master. Train. Excel.
                </Text>
                <Text variant="bodyLarge" style={styles.heroSubtitle}>
                  Build strong minds and bodies with disciplined Shotokan Karate training for kids,
                  teens, and adults.
                </Text>
                <View style={styles.heroButtons}>
                  <Button
                    mode="contained"
                    onPress={() => router.push('/(auth)/login')}
                    style={styles.primaryButton}
                    contentStyle={styles.primaryButtonContent}
                    labelStyle={styles.primaryButtonLabel}
                    buttonColor="#FFFFFF"
                    textColor="#7B2CBF"
                  >
                    Start Free Trial Class
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setSnackbar({ visible: true, message: 'Programs coming soon' })}
                    style={styles.secondaryButton}
                    contentStyle={styles.secondaryButtonContent}
                    labelStyle={styles.secondaryButtonLabel}
                    textColor="#FFFFFF"
                  >
                    View Programs
                  </Button>
                </View>
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#FBBF24" />
                    <Text style={styles.heroStatValue}>{data.studentCount}+</Text>
                    <Text style={styles.heroStatLabel}>Students</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <MaterialCommunityIcons name="office-building-marker" size={20} color="#FBBF24" />
                    <Text style={styles.heroStatValue}>{data.branches.length}</Text>
                    <Text style={styles.heroStatLabel}>Branches</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <MaterialCommunityIcons name="calendar-star" size={20} color="#FBBF24" />
                    <Text style={styles.heroStatValue}>10+</Text>
                    <Text style={styles.heroStatLabel}>Years</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Card>

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

        {/* LEGACY – SHIHAN PRADEEP KUMAR */}
        <PradeepLegacySection instructors={data.instructors} />

        {/* GALLERY - TRAINING FACILITIES */}
        <GallerySection
          galleryItems={data.galleryItems}
          onViewAllPress={handleViewAllGallery}
          onItemPress={handleGalleryItemPress}
        />

        {/* INSTRUCTORS */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Meet Our Instructors
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Learn from experienced black-belt instructors dedicated to your growth.
          </Text>
        </View>
        <InstructorsSection
          instructors={data.instructors}
          onInstructorPress={handleInstructorPress}
        />

        {/* LOCATIONS & CONTACT */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Find Our Dojo
          </Text>
          <Card mode="outlined" style={styles.infoCard}>
            <Card.Content>
              <List.Item
                title={dojoName}
                description={data.branches[0]?.address || 'Hubballi, Karnataka'}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
              />
              <Divider style={styles.cardDivider} />
              <List.Item
                title={data.branches[0]?.phone || 'Contact'}
                description="Call us for timings and fee details"
                left={(props) => <List.Icon {...props} icon="phone" />}
              />
            </Card.Content>
          </Card>
        </View>

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
    backgroundColor: '#F3F4F6',
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
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  heroContent: {
    flexDirection: 'column',
    gap: 16,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroBadge: {
    color: '#E5DEFF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#F9FAFB',
    marginBottom: 8,
  },
  heroButtons: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButton: {
    borderRadius: 24,
  },
  primaryButtonContent: {
    paddingVertical: 10,
  },
  primaryButtonLabel: {
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 24,
    borderColor: '#E5DEFF',
  },
  secondaryButtonContent: {
    paddingVertical: 8,
  },
  secondaryButtonLabel: {
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  heroStatLabel: {
    color: '#E5DEFF',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
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
