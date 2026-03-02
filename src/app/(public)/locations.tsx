import React from 'react'
import { View, StyleSheet, ScrollView, Linking } from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { usePublicData } from '@/lib/public/hooks/usePublicData'
import { ContactCard } from '@/components/public/ContactCard'
import { LocationCard } from '@/components/public/LocationCard'
import { SocialLinksCard } from '@/components/public/SocialLinksCard'

const CONTACT_INFO = {
  phone: '+91 9916836930',
  email: 'shotokankaratehubli@gmail.com',
  whatsapp: 'https://wa.me/919916836930',
}

const LOCATIONS = [
  {
    id: '1',
    name: 'Main Dojo',
    address: 'Shree Siddeshwara Kailasa Mantapa\nHosamath P.B Road, Unkal\nHubballi-31, Karnataka 580031',
    mapsUrl: 'https://www.google.co.in/maps/place/Shotokan+karate+sports+club+unkal/@15.3766879,75.1107688,17z/data=!3m1!4b1!4m6!3m5!1s0x3bb8d18c2fa3cd9d:0x50d008c233f0cca1!8m2!3d15.3766879!4d75.1133437!16s%2Fg%2F11qkqvhs5z?entry=ttu',
    schedule: [
      { days: 'Monday, Wednesday, Friday', time: 'Morning: 6:00-7:30 AM' },
      { days: 'Monday, Wednesday, Friday', time: 'Evening: 6:00-7:30 PM' },
    ],
  },
  {
    id: '2',
    name: 'Secondary Dojo',
    address: 'Dr. B.R. Ambedkar Samudaya Bhavana\nTeachers Colony, Sai Nagar, Unkal\nHubballi-31, Karnataka 580031',
    mapsUrl: 'https://maps.app.goo.gl/Qwi9NFdLH5DsMnVW6',
    schedule: [
      { days: 'Tuesday, Thursday', time: 'Morning: 6:00-7:30 AM' },
      { days: 'Tuesday, Thursday', time: 'Evening: 6:00-7:30 PM' },
      { days: 'Saturday', time: 'Evening: 6:00-7:30 PM' },
      { days: 'Sunday', time: 'Morning: 6:00-8:00 AM' },
    ],
  },
]

const SOCIAL_LINKS = [
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/@rajeshyaragatti1699',
    icon: 'youtube',
    color: '#FF0000',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/shotokankaratedoassociat/',
    icon: 'instagram',
    color: '#E4405F',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/COACH.R.B.YARAGATTI',
    icon: 'facebook',
    color: '#1877F2',
  },
]

export default function LocationsScreen() {
  const insets = useSafeAreaInsets()
  const { data, loading } = usePublicData()

  const handlePhonePress = () => {
    Linking.openURL(`tel:${CONTACT_INFO.phone}`)
  }

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${CONTACT_INFO.email}`)
  }

  const handleWhatsAppPress = () => {
    Linking.openURL(CONTACT_INFO.whatsapp)
  }

  const handleMapsPress = (url: string) => {
    Linking.openURL(url)
  }

  const handleSocialPress = (url: string) => {
    Linking.openURL(url)
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

  const dojoName = data?.branches && data.branches.length > 0 
    ? data.branches[0].name 
    : 'Karate Sports Club Hubballi'

  return (
    <View style={styles.container}>
      <PublicHeader logoUrl={data?.logoUrl} dojoName={dojoName} />
      
      {/* Hero Header Section - Trust Builder */}
      <View style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroContent}>
          <MaterialCommunityIcons name="map-marker-check" size={32} color="#34A853" style={styles.heroIcon} />
          <Text variant="headlineMedium" style={styles.heroTitle}>
            We're Here to Help
          </Text>
          <Text variant="bodyLarge" style={styles.heroSubtitle}>
            Karate Training • Hubli–Dharwad
          </Text>
          <Text variant="bodyMedium" style={styles.heroDescription}>
            Call, message, or visit our certified training centers. We respond instantly.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Information Card */}
        <ContactCard
          logoUrl={data?.logoUrl}
          phone={CONTACT_INFO.phone}
          email={CONTACT_INFO.email}
          whatsappUrl={CONTACT_INFO.whatsapp}
          onPhonePress={handlePhonePress}
          onEmailPress={handleEmailPress}
          onWhatsAppPress={handleWhatsAppPress}
        />

        {/* Training Locations Section */}
        <View style={styles.locationsHeader}>
          <MaterialCommunityIcons name="map-marker-multiple" size={28} color="#34A853" />
          <Text variant="titleLarge" style={styles.locationsTitle}>
            Training Locations
          </Text>
        </View>

        {LOCATIONS.map((location) => (
          <LocationCard
            key={location.id}
            name={location.name}
            address={location.address}
            mapsUrl={location.mapsUrl}
            schedule={location.schedule}
            onMapsPress={handleMapsPress}
          />
        ))}

        {/* Social Media Section */}
        <SocialLinksCard
          socialLinks={SOCIAL_LINKS}
          onSocialPress={handleSocialPress}
        />

        {/* Conversion Footer - High Trust */}
        <View style={styles.footer}>
          <View style={styles.ratingSection}>
            <View style={styles.starsContainer}>
              <MaterialCommunityIcons name="star" size={20} color="#FFB800" />
              <MaterialCommunityIcons name="star" size={20} color="#FFB800" />
              <MaterialCommunityIcons name="star" size={20} color="#FFB800" />
              <MaterialCommunityIcons name="star" size={20} color="#FFB800" />
              <MaterialCommunityIcons name="star" size={20} color="#FFB800" />
            </View>
            <Text variant="bodyLarge" style={styles.ratingText}>
              Rated ★★★★★ by 150+ students
            </Text>
          </View>
          <View style={styles.footerDivider} />
          <Text variant="bodyMedium" style={styles.footerName}>
            Official Karate Academy — Hubli & Dharwad
          </Text>
          <Text variant="bodySmall" style={styles.footerLocation}>
            Shotokan Karate-Do Association Youth Sports Club
          </Text>
          <Text variant="bodySmall" style={styles.footerLocation}>
            Hubballi, Karnataka, India
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#34A853',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  heroDescription: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  locationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  locationsTitle: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 22,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    marginTop: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  footerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  footerName: {
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 15,
  },
  footerLocation: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 4,
  },
})
