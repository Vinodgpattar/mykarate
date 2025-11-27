import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Alert } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { getAdminProfileByUserId, updateAdminProfile, uploadAdminProfileImage, type AdminProfileUpdate } from '@/lib/profiles'
import { getBranches, type Branch } from '@/lib/branches'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { logger } from '@/lib/logger'
import * as ImagePicker from 'expo-image-picker'

export default function AdminProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    qualifications: '',
    experience: '',
    specialization: '',
  })

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user])

  // Reload profile data when screen comes into focus (e.g., after navigating back)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadProfile()
      }
    }, [user])
  )

  const loadProfile = async () => {
    try {
      setLoading(true)
      const result = await getAdminProfileByUserId(user!.id)
      if (result.error) {
        logger.error('Error loading admin profile', result.error)
        setSnackbar({ visible: true, message: result.error.message })
        // Don't navigate back on error, just show the error
      } else if (result.profile) {
        const profile = result.profile
        logger.debug('Profile loaded successfully', {
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          qualifications: profile.qualifications,
          experience: profile.experience,
          specialization: profile.specialization,
          profileImageUrl: profile.profileImageUrl,
        })
        setFormData({
          name: profile.name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          qualifications: profile.qualifications || '',
          experience: profile.experience || '',
          specialization: profile.specialization || '',
        })
        setProfileImage(profile.profileImageUrl || null)

        // Load branch info if user is a branch admin
        if (profile.branchId && profile.role === 'admin') {
          const branchesResult = await getBranches()
          if (branchesResult.branches) {
            const userBranch = branchesResult.branches.find((b) => b.id === profile.branchId)
            if (userBranch) {
              setBranch(userBranch)
            }
          }
        }
      } else {
        // Profile is null but no error - this shouldn't happen for admins, but handle it gracefully
        logger.warn('Profile is null but no error returned', { userId: user!.id })
        setFormData({
          name: '',
          phone: '',
          address: '',
          qualifications: '',
          experience: '',
          specialization: '',
        })
        setProfileImage(null)
      }
    } catch (error) {
      logger.error('Error loading admin profile', error as Error)
      setSnackbar({ visible: true, message: 'Failed to load profile' })
      // Don't navigate back on error, just show the error
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    Alert.alert(
      'Select Profile Image',
      'Choose an option',
      [
        { 
          text: 'Camera', 
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
              setSnackbar({ visible: true, message: 'Permission to access camera is required' })
              return
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
              setProfileImage(result.assets[0].uri)
            }
          }
        },
        { 
          text: 'Gallery', 
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
              setSnackbar({ visible: true, message: 'Permission to access media library is required' })
              return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
              setProfileImage(result.assets[0].uri)
            }
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleSubmit = async () => {
    if (!user?.id) return

    try {
      setSaving(true)

      // Upload image if it's a new local file
      let profileImageUrl: string | undefined = undefined
      if (profileImage && profileImage.startsWith('file://')) {
        setUploadingImage(true)
        const uploadResult = await uploadAdminProfileImage(profileImage, user.id)
        if (uploadResult.error) {
          setSnackbar({ visible: true, message: `Failed to upload image: ${uploadResult.error.message}` })
          return
        }
        profileImageUrl = uploadResult.url || undefined
        setUploadingImage(false)
      } else if (profileImage) {
        // Already a URL, use it as is
        profileImageUrl = profileImage
      }

      const updateData: AdminProfileUpdate = {
        name: formData.name.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        qualifications: formData.qualifications.trim() || null,
        experience: formData.experience.trim() || null,
        specialization: formData.specialization.trim() || null,
        profileImageUrl: profileImageUrl || null,
      }

      const result = await updateAdminProfile(user.id, updateData)

      if (result.error) {
        logger.error('Failed to update profile', result.error)
        setSnackbar({ visible: true, message: result.error.message })
      } else {
        logger.debug('Profile update successful, reloading data...')
        setSnackbar({ visible: true, message: 'Profile updated successfully!' })
        // Wait a bit for database to update, then reload
        await new Promise(resolve => setTimeout(resolve, 500))
        // Reload profile data to show updated values
        await loadProfile()
        setTimeout(() => router.back(), 1500)
      }
    } catch (err: any) {
      setSnackbar({ visible: true, message: err.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
      setUploadingImage(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <AdminHeader title="Admin Profile" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
              <Text variant="bodySmall" style={styles.infoText}>
                Update your profile information. All fields are optional.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Profile Image */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-circle" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Profile Picture
              </Text>
            </View>
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} style={styles.imageContainer} activeOpacity={0.7}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="camera-plus" size={48} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.imageOverlay}>
                  <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text variant="bodySmall" style={styles.imageHint}>
                Tap to change profile picture
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Branch Information (Read-only for branch admins) */}
        {branch && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="office-building" size={24} color="#6366F1" />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Branch Assignment
                </Text>
              </View>
              <View style={styles.branchInfo}>
                <MaterialCommunityIcons name="office-building" size={20} color="#6B7280" />
                <Text variant="bodyMedium" style={styles.branchName}>
                  {branch.name}
                </Text>
                {branch.code && (
                  <Text variant="bodySmall" style={styles.branchCode}>
                    ({branch.code})
                  </Text>
                )}
              </View>
              <Text variant="bodySmall" style={styles.branchNote}>
                Branch assignment can only be changed by Super Admin
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Contact Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="phone" size={24} color="#7B2CBF" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Contact Information
              </Text>
            </View>

            <TextInput
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="account" />}
              placeholder="Enter your full name"
              maxLength={255}
            />

            <TextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="phone" />}
              placeholder="+91 1234567890"
            />

            <TextInput
              label="Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="map-marker" />}
              placeholder="Enter your address"
            />
          </Card.Content>
        </Card>

        {/* Professional Information */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="certificate" size={24} color="#10B981" />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Professional Information
              </Text>
            </View>

            <TextInput
              label="Qualifications"
              value={formData.qualifications}
              onChangeText={(text) => setFormData({ ...formData, qualifications: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="school" />}
              placeholder="e.g., 3rd Dan Black Belt"
              maxLength={200}
            />

            <TextInput
              label="Experience"
              value={formData.experience}
              onChangeText={(text) => setFormData({ ...formData, experience: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="clock-outline" />}
              placeholder="e.g., 15+ Years"
              maxLength={100}
            />

            <TextInput
              label="Specialization"
              value={formData.specialization}
              onChangeText={(text) => setFormData({ ...formData, specialization: text })}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="karate" />}
              placeholder="e.g., Shotokan Karate"
              maxLength={200}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Sticky Action Buttons */}
      <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={saving || uploadingImage}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={saving || uploadingImage}
            disabled={saving || uploadingImage}
            style={styles.submitButton}
            buttonColor="#7B2CBF"
          >
            {uploadingImage ? 'Uploading...' : 'Save Profile'}
          </Button>
        </View>
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={4000}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  stickyButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    color: '#6366F1',
    flex: 1,
    fontSize: 13,
  },
  card: {
    elevation: 2,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  imageSection: {
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  imageHint: {
    color: '#6B7280',
    textAlign: 'center',
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  branchName: {
    fontWeight: '600',
    color: '#1F2937',
  },
  branchCode: {
    color: '#6B7280',
  },
  branchNote: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  input: {
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
})

