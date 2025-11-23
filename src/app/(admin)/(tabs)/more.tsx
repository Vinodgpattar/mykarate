import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card, Button, List, Divider } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getProfileByUserId } from '@/lib/profiles'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export default function MoreScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserInfo()
  }, [user])

  const loadUserInfo = async () => {
    if (user?.id) {
      try {
        const result = await getProfileByUserId(user.id)
        if (result.profile) {
          setUserRole(result.profile.role)
        }
      } catch (error) {
        console.error('Error loading user info:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear React Query cache
              queryClient.clear()
              // Sign out from Supabase
              await signOut()
              // Navigate to login
              router.replace('/(auth)/login')
            } catch (error) {
              console.error('Error signing out:', error)
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="karate" size={24} color="#7B2CBF" />
              </View>
              <Text variant="headlineSmall" style={styles.brandName}>
                Settings
              </Text>
            </View>
          </View>
        </View>

        {/* User Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account-circle" size={48} color="#7B2CBF" />
              </View>
              <View style={styles.userDetails}>
                <Text variant="titleMedium" style={styles.userName}>
                  {user?.email || 'User'}
                </Text>
                <Text variant="bodySmall" style={styles.userRole}>
                  {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Branch Admin' : 'User'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Settings Options */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Profile"
              description="View and edit your profile"
              left={(props) => <List.Icon {...props} icon="account" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to profile screen
                Alert.alert('Coming Soon', 'Profile editing will be available soon.')
              }}
              style={styles.listItem}
            />

            <List.Item
              title="Notifications"
              description="Manage notification settings"
              left={(props) => <List.Icon {...props} icon="bell" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to notifications settings
                Alert.alert('Coming Soon', 'Notification settings will be available soon.')
              }}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="App Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" color="#7B2CBF" />}
              style={styles.listItem}
            />

            <List.Item
              title="Help & Support"
              description="Get help or contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Help & Support', 'For support, please contact your administrator.')
              }}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#F59E0B"
          icon="logout"
          loading={loading}
        >
          Sign Out
        </Button>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerLeft: {
    flex: 1,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userRole: {
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
    marginTop: 4,
  },
  listItem: {
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 20,
  },
})

