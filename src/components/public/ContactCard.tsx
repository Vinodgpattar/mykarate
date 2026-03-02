import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FontAwesome } from '@expo/vector-icons'
import { Ionicons } from '@expo/vector-icons'

interface ContactCardProps {
  logoUrl?: string | null
  phone: string
  email: string
  whatsappUrl: string
  onPhonePress: () => void
  onEmailPress: () => void
  onWhatsAppPress: () => void
}

export function ContactCard({
  logoUrl,
  phone,
  email,
  whatsappUrl,
  onPhonePress,
  onEmailPress,
  onWhatsAppPress,
}: ContactCardProps) {
  return (
    <View style={styles.container}>
      {/* Primary Contact Buttons - Big CTA Style */}
      <View style={styles.buttonsContainer}>
        {/* Call Us Button - Green */}
        <TouchableOpacity
          style={[styles.primaryButton, styles.callButton]}
          onPress={onPhonePress}
          activeOpacity={0.8}
          accessibilityLabel="Call us"
          accessibilityRole="button"
        >
          <View style={styles.iconCircle}>
            <Ionicons name="call" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text variant="titleMedium" style={styles.primaryButtonTitle}>
              Call Us
            </Text>
            <Text variant="bodySmall" style={styles.primaryButtonSubtitle}>
              {phone}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* WhatsApp Button - Official Green */}
        <TouchableOpacity
          style={[styles.primaryButton, styles.whatsappButton]}
          onPress={onWhatsAppPress}
          activeOpacity={0.8}
          accessibilityLabel="Chat with us on WhatsApp"
          accessibilityRole="button"
        >
          <View style={styles.iconCircle}>
            <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text variant="titleMedium" style={styles.primaryButtonTitle}>
              Chat on WhatsApp
            </Text>
            <Text variant="bodySmall" style={styles.primaryButtonSubtitle}>
              Instant response
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Email Button - Blue */}
        <TouchableOpacity
          style={[styles.primaryButton, styles.emailButton]}
          onPress={onEmailPress}
          activeOpacity={0.8}
          accessibilityLabel="Send us an email"
          accessibilityRole="button"
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="email" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text variant="titleMedium" style={styles.primaryButtonTitle}>
              Email Us
            </Text>
            <Text variant="bodySmall" style={styles.primaryButtonSubtitle} numberOfLines={1}>
              {email}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minHeight: 80,
  },
  callButton: {
    backgroundColor: '#0F9D58', // Google dialer green
  },
  whatsappButton: {
    backgroundColor: '#25D366', // Official WhatsApp green
  },
  emailButton: {
    backgroundColor: '#1A73E8', // Google Mail blue
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  primaryButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
})


