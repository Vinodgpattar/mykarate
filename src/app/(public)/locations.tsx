import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { Text, Card, Divider } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import { usePublicData } from '@/lib/public/hooks/usePublicData'
import { ActivityIndicator } from 'react-native-paper'

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
  const router = useRouter()
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
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Locations & Contact
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Information */}
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="phone" size={24} color="#7B2CBF" />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Contact Us
              </Text>
            </View>

            <Divider style={styles.divider} />

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handlePhonePress}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <MaterialCommunityIcons name="phone" size={20} color="#7B2CBF" />
                <Text variant="bodyLarge" style={styles.contactLabel}>
                  Phone
                </Text>
              </View>
              <Text variant="bodyLarge" style={styles.contactValue}>
                {CONTACT_INFO.phone}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleEmailPress}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <MaterialCommunityIcons name="email" size={20} color="#7B2CBF" />
                <Text variant="bodyLarge" style={styles.contactLabel}>
                  Email
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.contactValue}>
                {CONTACT_INFO.email}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleWhatsAppPress}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                <Text variant="bodyLarge" style={styles.contactLabel}>
                  WhatsApp
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Training Locations */}
        <Text variant="titleLarge" style={styles.locationsTitle}>
          Training Locations
        </Text>

        {LOCATIONS.map((location) => (
          <Card key={location.id} style={styles.locationCard} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <View style={styles.locationHeader}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#7B2CBF" />
                <Text variant="titleLarge" style={styles.locationName}>
                  {location.name}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.addressContainer}>
                <Text variant="bodyMedium" style={styles.address}>
                  {location.address}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.mapsButton}
                onPress={() => handleMapsPress(location.mapsUrl)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="map" size={20} color="#7B2CBF" />
                <Text variant="bodyMedium" style={styles.mapsButtonText}>
                  Open in Google Maps
                </Text>
                <MaterialCommunityIcons name="open-in-new" size={18} color="#7B2CBF" />
              </TouchableOpacity>

              <View style={styles.scheduleContainer}>
                <Text variant="labelMedium" style={styles.scheduleTitle}>
                  Training Schedule:
                </Text>
                {location.schedule.map((item, index) => (
                  <View key={index} style={styles.scheduleItem}>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={16}
                      color="#6B7280"
                      style={styles.scheduleIcon}
                    />
                    <View style={styles.scheduleText}>
                      <Text variant="bodySmall" style={styles.scheduleDays}>
                        {item.days}
                      </Text>
                      <Text variant="bodySmall" style={styles.scheduleTime}>
                        {item.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        ))}

        {/* Social Media */}
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="share-variant" size={24} color="#7B2CBF" />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Follow Us
              </Text>
            </View>

            <Divider style={styles.divider} />

            {SOCIAL_LINKS.map((social) => (
              <TouchableOpacity
                key={social.id}
                style={styles.socialItem}
                onPress={() => handleSocialPress(social.url)}
                activeOpacity={0.7}
              >
                <View style={styles.socialLeft}>
                  <MaterialCommunityIcons
                    name={social.icon as any}
                    size={24}
                    color={social.color}
                  />
                  <Text variant="bodyLarge" style={styles.socialName}>
                    {social.name}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>

        {/* Club Info */}
        <View style={styles.clubInfo}>
          <Text variant="bodyMedium" style={styles.clubName}>
            Shotokan Karate-Do Association Youth Sports Club
          </Text>
          <Text variant="bodySmall" style={styles.clubLocation}>
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
    backgroundColor: '#FFF8E7',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    marginVertical: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  contactLabel: {
    fontWeight: '600',
    color: '#111827',
  },
  contactValue: {
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  locationsTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  locationCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  locationName: {
    fontWeight: '700',
    color: '#111827',
  },
  addressContainer: {
    marginBottom: 16,
  },
  address: {
    color: '#374151',
    lineHeight: 22,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  mapsButtonText: {
    color: '#7B2CBF',
    fontWeight: '600',
    flex: 1,
  },
  scheduleContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scheduleTitle: {
    color: '#111827',
    fontWeight: '600',
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  scheduleIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  scheduleText: {
    flex: 1,
  },
  scheduleDays: {
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleTime: {
    color: '#6B7280',
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  socialName: {
    fontWeight: '600',
    color: '#111827',
  },
  clubInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  clubName: {
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  clubLocation: {
    color: '#6B7280',
    textAlign: 'center',
  },
})

