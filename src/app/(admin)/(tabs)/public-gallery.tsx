import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Snackbar,
  IconButton,
  Dialog,
  TextInput,
  Switch,
  FAB,
  ProgressBar,
} from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  getAllGalleryItems,
  uploadGalleryImage,
  uploadGalleryVideo,
  createGalleryItem,
  deleteGalleryItem,
  updateGalleryItem,
} from '@/lib/public/services/galleryService'
import type { PublicGalleryItem } from '@/lib/public/types/public.types'
import { logger } from '@/lib/logger'

// Feature flag: Set to true to enable video upload feature
const ENABLE_VIDEO_UPLOAD = false

export default function PublicGalleryScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [items, setItems] = useState<PublicGalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' })
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<PublicGalleryItem | null>(null)
  const [editDialogVisible, setEditDialogVisible] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<PublicGalleryItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [uploadConfirmVisible, setUploadConfirmVisible] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<{ type: 'image' | 'video'; uri: string } | null>(null)
  const [uploadProgress, setUploadProgress] = useState({ visible: false, progress: 0, message: '' })

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllGalleryItems()
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }
      setItems(result.items || [])
    } catch (error) {
      logger.error('Error loading gallery', error as Error)
      setSnackbar({ visible: true, message: 'Failed to load gallery' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadGallery()
    }
  }, [user, loadGallery])

  // Refresh gallery when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadGallery()
      }
    }, [user, loadGallery])
  )

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        setSnackbar({ visible: true, message: 'Permission to access media library is required' })
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0] && user?.id) {
        // Show confirmation dialog instead of uploading immediately
        setPendingUpload({ type: 'image', uri: result.assets[0].uri })
        setUploadConfirmVisible(true)
      }
    } catch (error) {
      logger.error('Error picking image', error as Error)
      setSnackbar({ visible: true, message: 'Failed to pick image' })
    }
  }

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        setSnackbar({ visible: true, message: 'Permission to access media library is required' })
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      })

      if (!result.canceled && result.assets[0] && user?.id) {
        // Show confirmation dialog instead of uploading immediately
        setPendingUpload({ type: 'video', uri: result.assets[0].uri })
        setUploadConfirmVisible(true)
      }
    } catch (error) {
      logger.error('Error picking video', error as Error)
      setSnackbar({ visible: true, message: 'Failed to pick video' })
    }
  }

  const confirmUpload = async () => {
    if (!pendingUpload || !user?.id) return

    setUploadConfirmVisible(false)
    const { type, uri } = pendingUpload
    setPendingUpload(null)

    if (type === 'image') {
      await handleUploadImage(uri)
    } else {
      await handleUploadVideo(uri)
    }
  }

  const handleUploadImage = async (imageUri: string) => {
    if (!user?.id) return

    try {
      setUploading(true)
      setUploadProgress({ visible: true, progress: 0, message: 'Starting upload...' })
      
      const uploadResult = await uploadGalleryImage(
        imageUri,
        user.id,
        (progress, message) => {
          setUploadProgress({ visible: true, progress, message })
        }
      )
      
      if (uploadResult.error) {
        setUploadProgress({ visible: false, progress: 0, message: '' })
        setSnackbar({ visible: true, message: uploadResult.error.message })
        return
      }

      setUploadProgress({ visible: true, progress: 95, message: 'Creating gallery item...' })
      const createResult = await createGalleryItem({
        media_type: 'image',
        file_url: uploadResult.url!,
        uploaded_by: user.id,
        is_featured: false,
      })

      if (createResult.error) {
        setUploadProgress({ visible: false, progress: 0, message: '' })
        setSnackbar({ visible: true, message: createResult.error.message })
        return
      }

      setUploadProgress({ visible: false, progress: 0, message: '' })
      setSnackbar({ visible: true, message: 'Image uploaded successfully' })
      // Auto-refresh gallery
      await loadGallery()
    } catch (error) {
      logger.error('Error uploading image', error as Error)
      setUploadProgress({ visible: false, progress: 0, message: '' })
      setSnackbar({ visible: true, message: 'Failed to upload image' })
    } finally {
      setUploading(false)
    }
  }

  const handleUploadVideo = async (videoUri: string) => {
    if (!user?.id) return

    try {
      setUploading(true)
      setUploadProgress({ visible: true, progress: 0, message: 'Starting upload...' })
      
      const uploadResult = await uploadGalleryVideo(
        videoUri,
        user.id,
        (progress, message) => {
          setUploadProgress({ visible: true, progress, message })
        }
      )
      
      if (uploadResult.error) {
        setUploadProgress({ visible: false, progress: 0, message: '' })
        setSnackbar({ visible: true, message: uploadResult.error.message })
        return
      }

      setUploadProgress({ visible: true, progress: 95, message: 'Creating gallery item...' })
      const createResult = await createGalleryItem({
        media_type: 'video',
        file_url: uploadResult.url!,
        thumbnail_url: uploadResult.thumbnailUrl || null,
        uploaded_by: user.id,
        is_featured: false,
      })

      if (createResult.error) {
        setUploadProgress({ visible: false, progress: 0, message: '' })
        setSnackbar({ visible: true, message: createResult.error.message })
        return
      }

      setUploadProgress({ visible: false, progress: 0, message: '' })
      setSnackbar({ visible: true, message: 'Video uploaded successfully' })
      // Auto-refresh gallery
      await loadGallery()
    } catch (error) {
      logger.error('Error uploading video', error as Error)
      setUploadProgress({ visible: false, progress: 0, message: '' })
      setSnackbar({ visible: true, message: 'Failed to upload video' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (item: PublicGalleryItem) => {
    setItemToDelete(item)
    setDeleteDialogVisible(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      const result = await deleteGalleryItem(itemToDelete.id)
      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      setDeleteDialogVisible(false)
      setItemToDelete(null)
      // Auto-refresh gallery after delete
      await loadGallery()
      setSnackbar({ visible: true, message: 'Item deleted successfully' })
    } catch (error) {
      logger.error('Error deleting item', error as Error)
      setSnackbar({ visible: true, message: 'Failed to delete item' })
    }
  }

  const handleEdit = (item: PublicGalleryItem) => {
    setItemToEdit(item)
    setEditTitle(item.title || '')
    setEditFeatured(item.is_featured)
    setEditDialogVisible(true)
  }

  const confirmEdit = async () => {
    if (!itemToEdit) return

    try {
      const result = await updateGalleryItem(itemToEdit.id, {
        title: editTitle || null,
        is_featured: editFeatured,
      })

      if (result.error) {
        setSnackbar({ visible: true, message: result.error.message })
        return
      }

      setSnackbar({ visible: true, message: 'Item updated successfully' })
      setEditDialogVisible(false)
      setItemToEdit(null)
      await loadGallery()
    } catch (error) {
      logger.error('Error updating item', error as Error)
      setSnackbar({ visible: true, message: 'Failed to update item' })
    }
  }

  // Counts - items already filtered to active only by getAllGalleryItems
  const imageCount = items.filter(item => item.media_type === 'image').length
  const videoCount = items.filter(item => item.media_type === 'video').length

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7B2CBF" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading gallery...
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Public Gallery"
        subtitle="Manage images and videos for public view"
      />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="image" size={24} color="#7B2CBF" />
            <Text variant="titleLarge" style={styles.statValue}>
              {imageCount}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Images ({imageCount}/{20})
            </Text>
          </Card.Content>
        </Card>
        {ENABLE_VIDEO_UPLOAD && (
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="video" size={24} color="#7B2CBF" />
              <Text variant="titleLarge" style={styles.statValue}>
                {videoCount}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Videos ({videoCount}/{10})
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Gallery Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="image-off" size={64} color="#9CA3AF" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Gallery Items
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {ENABLE_VIDEO_UPLOAD
                  ? 'Upload images or videos to get started'
                  : 'Upload images to get started'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.grid}>
            {items.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                {item.media_type === 'image' ? (
                  <Image
                    source={{ uri: item.file_url }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoContainer}>
                    {item.thumbnail_url ? (
                      <Image
                        source={{ uri: item.thumbnail_url }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <MaterialCommunityIcons name="play-circle" size={48} color="#FFFFFF" />
                      </View>
                    )}
                    <View style={styles.playOverlay}>
                      <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                )}
                {item.is_featured && (
                  <View style={styles.featuredBadge}>
                    <MaterialCommunityIcons name="star" size={16} color="#FFFFFF" />
                  </View>
                )}
                <Card.Actions style={styles.cardActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => handleEdit(item)}
                    iconColor="#7B2CBF"
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDelete(item)}
                    iconColor="#DC2626"
                  />
                </Card.Actions>
                {item.title && (
                  <Text variant="bodySmall" style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          if (ENABLE_VIDEO_UPLOAD) {
            Alert.alert(
              'Upload Media',
              'Choose media type',
              [
                { text: 'Image', onPress: handlePickImage },
                { text: 'Video', onPress: handlePickVideo },
                { text: 'Cancel', style: 'cancel' },
              ]
            )
          } else {
            // Directly open image picker if video upload is disabled
            handlePickImage()
          }
        }}
        loading={uploading}
        disabled={uploading}
      />

      {/* Delete Dialog */}
      <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
        <Dialog.Title>Delete Gallery Item</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            Are you sure you want to delete this item? This action cannot be undone.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
          <Button onPress={confirmDelete} textColor="#DC2626">
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Upload Confirmation Dialog */}
      <Dialog visible={uploadConfirmVisible} onDismiss={() => {
        setUploadConfirmVisible(false)
        setPendingUpload(null)
      }}>
        <Dialog.Title>Confirm Upload</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            Are you sure you want to upload this {pendingUpload?.type === 'image' ? 'image' : 'video'}?
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => {
            setUploadConfirmVisible(false)
            setPendingUpload(null)
          }}>Cancel</Button>
          <Button onPress={confirmUpload} mode="contained" buttonColor="#7B2CBF">
            Upload
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
        <Dialog.Title>Edit Gallery Item</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Title (Optional)"
            value={editTitle}
            onChangeText={setEditTitle}
            mode="outlined"
            style={styles.editInput}
          />
          <View style={styles.switchRow}>
            <Text variant="bodyMedium">Featured</Text>
            <Switch value={editFeatured} onValueChange={setEditFeatured} />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
          <Button onPress={confirmEdit} mode="contained">
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Upload Progress Dialog */}
      <Dialog visible={uploadProgress.visible} dismissable={false}>
        <Dialog.Title>Uploading Media</Dialog.Title>
        <Dialog.Content>
          <View style={styles.progressContainer}>
            <Text variant="bodyMedium" style={styles.progressMessage}>
              {uploadProgress.message}
            </Text>
            <ProgressBar
              progress={uploadProgress.progress / 100}
              color="#7B2CBF"
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressPercentage}>
              {Math.round(uploadProgress.progress)}%
            </Text>
          </View>
        </Dialog.Content>
      </Dialog>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    maxWidth: 300,
    elevation: 1,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#7B2CBF',
    marginTop: 8,
  },
  statLabel: {
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyCard: {
    marginTop: 40,
    elevation: 0,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#1A1A1A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 4,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  itemTitle: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#7B2CBF',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  editInput: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    paddingVertical: 8,
  },
  progressMessage: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressPercentage: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 4,
  },
})

