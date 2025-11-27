import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native'
import { Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { PublicGalleryItem } from '@/lib/public/types/public.types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

interface GallerySectionProps {
  galleryItems: PublicGalleryItem[]
  onViewAllPress: () => void
  onItemPress: (item: PublicGalleryItem) => void
}

export function GallerySection({ galleryItems, onViewAllPress, onItemPress }: GallerySectionProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set())

  // Show featured items first, then limit to 4 items for preview
  const previewItems = galleryItems
    .filter(item => item.is_featured)
    .slice(0, 4)

  if (previewItems.length === 0) {
    return null
  }

  const handleImageLoadStart = (itemId: string) => {
    setImageLoading(prev => new Set(prev).add(itemId))
  }

  const handleImageLoadEnd = (itemId: string) => {
    setImageLoading(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId))
    setImageLoading(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Our Training Facilities
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Explore our premium training spaces designed for excellence
        </Text>
      </View>
      <View style={styles.grid}>
        {previewItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
          >
            {item.media_type === 'video' ? (
              <View style={styles.videoContainer}>
                {item.thumbnail_url && !imageErrors.has(item.id) ? (
                  <>
                    {imageLoading.has(item.id) && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    )}
                    <Image
                      source={{ uri: item.thumbnail_url }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                      onLoadStart={() => handleImageLoadStart(item.id)}
                      onLoadEnd={() => handleImageLoadEnd(item.id)}
                      onError={() => handleImageError(item.id)}
                    />
                  </>
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <MaterialCommunityIcons name="play-circle" size={48} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.playOverlay}>
                  <MaterialCommunityIcons name="play" size={32} color="#FFFFFF" />
                </View>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                {imageLoading.has(item.id) && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#7B2CBF" />
                  </View>
                )}
                {imageErrors.has(item.id) ? (
                  <View style={styles.errorPlaceholder}>
                    <MaterialCommunityIcons name="image-off" size={32} color="#9CA3AF" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: item.file_url }}
                    style={styles.image}
                    resizeMode="cover"
                    onLoadStart={() => handleImageLoadStart(item.id)}
                    onLoadEnd={() => handleImageLoadEnd(item.id)}
                    onError={() => handleImageError(item.id)}
                  />
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {galleryItems.length > 4 && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAllPress}
          activeOpacity={0.7}
        >
          <Text variant="bodyLarge" style={styles.viewAllText}>
            View Full Gallery →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: IS_MOBILE ? 40 : 60,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: IS_MOBILE ? 24 : 48,
    marginBottom: IS_MOBILE ? 24 : 32,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: IS_MOBILE ? 24 : 48,
    gap: IS_MOBILE ? 12 : 16,
  },
  gridItem: {
    width: IS_MOBILE ? '48%' : '47%',
    aspectRatio: 1,
    borderRadius: IS_MOBILE ? 12 : 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
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
  viewAllButton: {
    marginTop: IS_MOBILE ? 24 : 32,
    paddingHorizontal: IS_MOBILE ? 24 : 48,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
})

