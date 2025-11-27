import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { Branch } from '@/lib/public/types/public.types'

interface FooterSectionProps {
  primaryBranch?: Branch | null
}

export function FooterSection({ primaryBranch }: FooterSectionProps) {
  const handleCall = (phone: string | null) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`)
    }
  }

  const handleEmail = (email: string | null) => {
    if (email) {
      Linking.openURL(`mailto:${email}`)
    }
  }

  if (!primaryBranch) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          Contact Us
        </Text>
        {primaryBranch.phone && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleCall(primaryBranch.phone)}
          >
            <MaterialCommunityIcons name="phone" size={20} color="#7B2CBF" />
            <Text variant="bodyMedium" style={styles.contactText}>
              {primaryBranch.phone}
            </Text>
          </TouchableOpacity>
        )}
        {primaryBranch.email && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleEmail(primaryBranch.email)}
          >
            <MaterialCommunityIcons name="email" size={20} color="#7B2CBF" />
            <Text variant="bodyMedium" style={styles.contactText}>
              {primaryBranch.email}
            </Text>
          </TouchableOpacity>
        )}
        {primaryBranch.address && (
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#7B2CBF" />
            <Text variant="bodyMedium" style={styles.contactText}>
              {primaryBranch.address}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.copyright}>
          © {new Date().getFullYear()} {primaryBranch.name}. All rights reserved.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 32,
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  contactText: {
    marginLeft: 12,
    color: '#6B7280',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  copyright: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

