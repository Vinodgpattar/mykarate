import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { Branch } from '@/lib/public/types/public.types'

interface LocationsSectionProps {
  branches: Branch[]
}

export function LocationsSection({ branches }: LocationsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

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

  const handleMap = (address: string | null, name: string) => {
    if (address) {
      const encodedAddress = encodeURIComponent(`${name}, ${address}`)
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`)
    }
  }

  if (branches.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Training Locations
        </Text>
      </View>
      {branches.map((branch) => {
        const isExpanded = expandedId === branch.id
        return (
          <Card key={branch.id} style={styles.card}>
            <TouchableOpacity
              onPress={() => toggleExpand(branch.id)}
              activeOpacity={0.7}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.headerRow}>
                  <View style={styles.iconTitleRow}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={24}
                      color="#7B2CBF"
                      style={styles.icon}
                    />
                    <Text variant="titleMedium" style={styles.branchName}>
                      {branch.name}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#6B7280"
                  />
                </View>
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {branch.address && (
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={20}
                          color="#6B7280"
                          style={styles.infoIcon}
                        />
                        <Text variant="bodyMedium" style={styles.infoText}>
                          {branch.address}
                        </Text>
                      </View>
                    )}
                    {branch.phone && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleCall(branch.phone)}
                      >
                        <MaterialCommunityIcons
                          name="phone"
                          size={20}
                          color="#7B2CBF"
                        />
                        <Text variant="bodyMedium" style={styles.actionText}>
                          {branch.phone}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {branch.email && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEmail(branch.email)}
                      >
                        <MaterialCommunityIcons
                          name="email"
                          size={20}
                          color="#7B2CBF"
                        />
                        <Text variant="bodyMedium" style={styles.actionText}>
                          {branch.email}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {branch.address && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleMap(branch.address, branch.name)}
                      >
                        <MaterialCommunityIcons
                          name="map"
                          size={20}
                          color="#7B2CBF"
                        />
                        <Text variant="bodyMedium" style={styles.actionText}>
                          Open in Maps
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card.Content>
            </TouchableOpacity>
          </Card>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  branchName: {
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 12,
    color: '#7B2CBF',
    fontWeight: '500',
  },
})

