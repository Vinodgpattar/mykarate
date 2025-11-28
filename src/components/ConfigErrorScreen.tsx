import React from 'react'
import { View, StyleSheet, ScrollView, Linking } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface ConfigErrorScreenProps {
  error: Error
}

export function ConfigErrorScreen({ error }: ConfigErrorScreenProps) {
  const openEASDashboard = () => {
    Linking.openURL('https://expo.dev/accounts/vinodgpattar/projects/karate-dojo-mobile/variables')
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
            </View>
            
            <Text variant="headlineSmall" style={styles.title}>
              Configuration Error
            </Text>
            
            <Text variant="bodyMedium" style={styles.message}>
              {error.message}
            </Text>

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                How to Fix:
              </Text>
              
              <Text variant="bodySmall" style={styles.instruction}>
                1. Go to EAS Dashboard
              </Text>
              <Text variant="bodySmall" style={styles.instruction}>
                2. Navigate to: Your Project → Environment Variables
              </Text>
              <Text variant="bodySmall" style={styles.instruction}>
                3. Add these required variables:
              </Text>
              
              <View style={styles.variableList}>
                <Text style={styles.variable}>• EXPO_PUBLIC_SUPABASE_URL</Text>
                <Text style={styles.variable}>• EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
                <Text style={styles.variable}>• EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (optional)</Text>
              </View>
              
              <Text variant="bodySmall" style={styles.instruction}>
                4. Rebuild the APK after adding variables
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={openEASDashboard}
              style={styles.button}
              icon="open-in-new"
            >
              Open EAS Dashboard
            </Button>

            {__DEV__ && (
              <View style={styles.devSection}>
                <Text variant="labelSmall" style={styles.devLabel}>
                  Development Mode:
                </Text>
                <Text variant="bodySmall" style={styles.devText}>
                  Create a `.env.local` file in the project root with the required variables.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instruction: {
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  variableList: {
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 8,
  },
  variable: {
    color: '#374151',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  button: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#7B2CBF',
    marginTop: 8,
  },
  devSection: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    width: '100%',
  },
  devLabel: {
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 4,
  },
  devText: {
    color: '#92400E',
    fontSize: 11,
    lineHeight: 16,
  },
})



