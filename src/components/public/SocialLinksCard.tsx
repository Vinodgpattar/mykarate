import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FontAwesome } from '@expo/vector-icons'

interface SocialLink {
  id: string
  name: string
  url: string
  icon: string
  color: string
}

interface SocialLinksCardProps {
  socialLinks: SocialLink[]
  onSocialPress: (url: string) => void
}

export function SocialLinksCard({
  socialLinks,
  onSocialPress,
}: SocialLinksCardProps) {
  // Get official brand colors
  const getBrandColor = (id: string) => {
    switch (id) {
      case 'youtube':
        return '#FF0000'
      case 'instagram':
        return '#E1306C' // Instagram gradient start
      case 'facebook':
        return '#1877F2'
      default:
        return '#6B7280'
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="share-variant" size={28} color="#111827" />
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Follow Us
        </Text>
      </View>

      <View style={styles.socialGrid}>
        {socialLinks.map((social) => {
          const brandColor = getBrandColor(social.id)
          return (
            <TouchableOpacity
              key={social.id}
              style={styles.socialCard}
              onPress={() => onSocialPress(social.url)}
              activeOpacity={0.8}
              accessibilityLabel={`Follow us on ${social.name}`}
              accessibilityRole="button"
            >
              <View style={[styles.socialIconCircle, { backgroundColor: brandColor }]}>
                <FontAwesome
                  name={social.icon as any}
                  size={28}
                  color="#FFFFFF"
                />
              </View>
              <Text variant="bodyMedium" style={styles.socialName}>
                {social.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 22,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  socialCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  socialIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  socialName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 14,
    textAlign: 'center',
  },
})


