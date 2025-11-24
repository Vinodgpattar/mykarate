import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card, Button } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'

export default function StudentDashboardScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleSignOut = async () => {
    try {
      // Clear React Query cache
      queryClient.clear()
      // Sign out from Supabase
      await signOut()
      // Navigate to login
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Student Dashboard
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Welcome, {user?.email}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Karate Dojo</Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              This is the student dashboard. Features will be added here.
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.button}
          buttonColor="#7B2CBF"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  cardText: {
    marginTop: 8,
    color: '#666',
  },
  button: {
    marginTop: 20,
  },
})



