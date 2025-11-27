import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card, Button, List, Divider } from 'react-native-paper'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Alert } from 'react-native'
import { getProfileByUserId } from '@/lib/profiles'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AccountSettingsScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
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
    <View style={styles.container}>
      <AdminHeader title="Account & Settings" showBackButton />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <Card.Content>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account-circle" size={56} color="#7B2CBF" />
              </View>
              <View style={styles.userDetails}>
                <Text variant="titleLarge" style={styles.userName}>
                  {user?.email?.split('@')[0] || 'Admin'}
                </Text>
                <Text variant="bodyMedium" style={styles.userEmail}>
                  {user?.email || 'user@example.com'}
                </Text>
                <View style={styles.roleBadge}>
                  <MaterialCommunityIcons 
                    name={userRole === 'super_admin' ? 'shield-crown' : 'shield-account'} 
                    size={14} 
                    color="#7B2CBF" 
                  />
                  <Text variant="bodySmall" style={styles.userRole}>
                    {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Branch Admin' : 'User'}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Settings
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="My Profile"
              description="View and edit your profile information"
              left={(props) => <List.Icon {...props} icon="account-circle" color="#7B2CBF" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                router.push('/(admin)/(tabs)/admin-profile')
              }}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* App Information */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              App Information
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information-outline" color="#6B7280" />}
              style={styles.listItem}
            />

            <List.Item
              title="Build"
              description="Production"
              left={(props) => <List.Icon {...props} icon="code-tags" color="#6B7280" />}
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
    backgroundColor: '#FFF8E7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  userCard: {
    marginBottom: 20,
    elevation: 3,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardContent: {
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontSize: 20,
  },
  userEmail: {
    color: '#6B7280',
    marginBottom: 8,
    fontSize: 14,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userRole: {
    color: '#7B2CBF',
    textTransform: 'capitalize',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontSize: 16,
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
    borderRadius: 12,
    paddingVertical: 4,
  },
  bottomPadding: {
    height: 20,
  },
})

