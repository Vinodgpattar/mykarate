import { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native'
import { Text } from 'react-native-paper'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import ImageViewing from 'react-native-image-viewing'
import { usePublicData } from '@/lib/public/hooks/usePublicData'
import { PublicHeader } from '@/components/public/shared/PublicHeader'
import type { PublicGalleryItem } from '@/lib/public/types/public.types'
import { YouTubePlayer, extractYouTubeVideoId } from '@/components/public/YouTubePlayer'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768
const ITEM_SPACING = 12
const ITEM_WIDTH = (SCREEN_WIDTH - (IS_MOBILE ? 32 : 48) - ITEM_SPACING) / 2 // 2 columns

export default function GalleryScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, loading } = usePublicData()
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set())
  const [galleryViewerVisible, setGalleryViewerVisible] = useState(false)
  const [galleryViewerIndex, setGalleryViewerIndex] = useState(0)
  const [youtubePlayerVisible, setYoutubePlayerVisible] = useState(false)
  const [selectedYouTubeVideo, setSelectedYouTubeVideo] = useState<{ videoId: string; title?: string } | null>(null)

  // Filter to show active images and YouTube videos
  const galleryItems = useMemo(() => {
    if (!data?.galleryItems) return []
    return data.galleryItems.filter(
      item => (item.media_type === 'image' || item.media_type === 'youtube') && item.is_active
    )
  }, [data?.galleryItems])

  // Separate images for image viewer
  const imageItems = useMemo(() => {
    return galleryItems.filter(item => item.media_type === 'image')
  }, [galleryItems])

  // Prepare gallery images for viewer
  const galleryImages = useMemo(() => {
    return imageItems.map(item => ({ uri: item.file_url }))
  }, [imageItems])

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

  const handleImagePress = (item: PublicGalleryItem) => {
    const index = imageItems.findIndex(i => i.id === item.id)
    if (index >= 0) {
      setGalleryViewerIndex(index)
      setGalleryViewerVisible(true)
    }
  }

  const handleYouTubePress = (item: PublicGalleryItem) => {
    const videoId = extractYouTubeVideoId(item.file_url)
    if (videoId) {
      setSelectedYouTubeVideo({ videoId, title: item.title || undefined })
      setYoutubePlayerVisible(true)
    }
  }

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

  const dojoName = data?.branches && data.branches.length > 0 
    ? data.branches[0].name 
    : 'Karate Sports Club Hubballi'

  return (
    <View style={styles.container}>
      <PublicHeader logoUrl={data?.logoUrl} dojoName={dojoName} />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text variant="headlineSmall" style={styles.title}>
          Gallery
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {galleryItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="image-off" size={64} color="#9CA3AF" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Gallery Items Available
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Check back later for gallery updates
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {galleryItems.map((item) => {
              // Handle YouTube videos
              if (item.media_type === 'youtube') {
                const videoId = extractYouTubeVideoId(item.file_url)
                const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.galleryItem, { width: ITEM_WIDTH }]}
                    onPress={() => handleYouTubePress(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.imageContainer}>
                      {thumbnailUrl ? (
                        <Image
                          source={{ uri: thumbnailUrl }}
                          style={styles.image}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.errorPlaceholder}>
                          <MaterialCommunityIcons name="youtube" size={48} color="#FF0000" />
                        </View>
                      )}
                      <View style={styles.youtubeOverlay}>
                        <MaterialCommunityIcons name="play-circle" size={48} color="#FFFFFF" />
                      </View>
                    </View>
                    {item.title && (
                      <Text variant="bodySmall" style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    )}
                  </TouchableOpacity>
                )
              }
              
              // Handle images
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.galleryItem, { width: ITEM_WIDTH }]}
                  onPress={() => handleImagePress(item)}
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
                  {item.title && (
                    <Text variant="bodySmall" style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Gallery Viewer */}
      {galleryImages.length > 0 && (
        <ImageViewing
          images={galleryImages}
          imageIndex={galleryViewerIndex}
          visible={galleryViewerVisible}
          onRequestClose={() => setGalleryViewerVisible(false)}
          presentationStyle="overFullScreen"
        />
      )}

      {/* YouTube Player */}
      {selectedYouTubeVideo && (
        <YouTubePlayer
          visible={youtubePlayerVisible}
          videoId={selectedYouTubeVideo.videoId}
          videoTitle={selectedYouTubeVideo.title}
          onClose={() => {
            setYoutubePlayerVisible(false)
            setSelectedYouTubeVideo(null)
          }}
        />
      )}
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: IS_MOBILE ? 16 : 24,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#1A1A1A',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ITEM_SPACING,
  },
  galleryItem: {
    borderRadius: IS_MOBILE ? 20 : 24,
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
  youtubeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  itemTitle: {
    marginTop: 8,
    paddingHorizontal: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
})

