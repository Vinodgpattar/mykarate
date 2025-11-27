import { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { PublicGalleryItem } from '@/lib/public/types/public.types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768
const ITEM_WIDTH = IS_MOBILE ? SCREEN_WIDTH * 0.7 : 300
const ITEM_SPACING = 16

interface SlidableGallerySectionProps {
  galleryItems: PublicGalleryItem[]
  onViewAllPress: () => void
  onItemPress: (item: PublicGalleryItem) => void
}

export function SlidableGallerySection({ galleryItems, onViewAllPress, onItemPress }: SlidableGallerySectionProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set())

  // Filter to show only images (exclude videos for slider)
  const imageItems = galleryItems.filter(item => item.media_type === 'image' && item.is_active)

  if (imageItems.length === 0) {
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
        <Text variant="titleLarge" style={styles.title}>
          Gallery
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Explore our training facilities and moments
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {imageItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.galleryItem, { width: ITEM_WIDTH }]}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
          >
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
          </TouchableOpacity>
        ))}

        {/* View Full Gallery Button */}
        <TouchableOpacity
          style={[styles.viewAllCard, { width: ITEM_WIDTH }]}
          onPress={onViewAllPress}
          activeOpacity={0.8}
        >
          <View style={styles.viewAllContent}>
            <MaterialCommunityIcons name="image-multiple" size={48} color="#7B2CBF" />
            <Text variant="titleMedium" style={styles.viewAllTitle}>
              View Full Gallery
            </Text>
            <Text variant="bodySmall" style={styles.viewAllSubtitle}>
              See all {imageItems.length} images
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="#7B2CBF" style={styles.arrowIcon} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: IS_MOBILE ? 24 : 32,
    paddingBottom: IS_MOBILE ? 0 : 0,
    backgroundColor: '#FFF8E7',
  },
  header: {
    paddingHorizontal: IS_MOBILE ? 16 : 24,
    marginBottom: IS_MOBILE ? 16 : 20,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: IS_MOBILE ? 16 : 24,
    paddingRight: IS_MOBILE ? 16 : 24,
  },
  galleryItem: {
    marginRight: ITEM_SPACING,
    borderRadius: IS_MOBILE ? 20 : 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    padding: 0,
    margin: 0,
    alignSelf: 'flex-start',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    aspectRatio: 4/3,
    position: 'relative',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    borderRadius: IS_MOBILE ? 20 : 24,
    margin: 0,
    padding: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1,
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: IS_MOBILE ? 20 : 24,
  },
  viewAllCard: {
    marginRight: 0,
    borderRadius: IS_MOBILE ? 20 : 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    padding: 0,
    margin: 0,
    alignSelf: 'flex-start',
  },
  viewAllContent: {
    width: ITEM_WIDTH,
    aspectRatio: 4/3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: IS_MOBILE ? 16 : 20,
    gap: 8,
  },
  viewAllTitle: {
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
  },
  viewAllSubtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  arrowIcon: {
    marginTop: 8,
  },
})

