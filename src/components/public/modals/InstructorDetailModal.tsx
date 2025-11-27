import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import { Text, Modal, IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ImageViewing from 'react-native-image-viewing'
import { useState } from 'react'
import type { Instructor } from '@/lib/public/types/public.types'

interface InstructorDetailModalProps {
  instructor: Instructor | null
  visible: boolean
  onClose: () => void
}

export function InstructorDetailModal({ instructor, visible, onClose }: InstructorDetailModalProps) {
  const insets = useSafeAreaInsets()
  const [imageViewerVisible, setImageViewerVisible] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!instructor) return null

  // Prepare images for gallery viewer
  const galleryImages = [
    ...(instructor.profile_image_url ? [{ uri: instructor.profile_image_url }] : []),
    ...(instructor.gallery_urls || []).map(url => ({ uri: url })),
  ]

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index)
    setImageViewerVisible(true)
  }

  return (
    <>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modal, { paddingTop: insets.top }]}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              iconColor="#FFFFFF"
              style={styles.closeButton}
            />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Image */}
            {instructor.profile_image_url ? (
              <TouchableOpacity
                onPress={() => handleImagePress(0)}
                activeOpacity={0.9}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: instructor.profile_image_url }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="account" size={80} color="#9CA3AF" />
              </View>
            )}

            {/* Name and Title */}
            <View style={styles.nameContainer}>
              <Text variant="headlineMedium" style={styles.name}>
                {instructor.name}
              </Text>
              {instructor.name.toLowerCase().includes('pradeep') && (
                <Text variant="bodyMedium" style={styles.legacyLabel}>
                  In loving memory of our guiding master
                </Text>
              )}
              {instructor.title && (
                <Text variant="titleMedium" style={styles.title}>
                  {instructor.title}
                </Text>
              )}
              {instructor.belt_rank && (
                <View style={styles.rankBadge}>
                  <Text variant="bodyLarge" style={styles.rank}>
                    {instructor.belt_rank}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {instructor.description && (
              <View style={styles.section}>
                <Text variant="bodyLarge" style={styles.description}>
                  {instructor.description}
                </Text>
              </View>
            )}

            {/* Experience and Specialization */}
            {(instructor.experience_years || instructor.specialization) && (
              <View style={styles.infoRow}>
                {instructor.experience_years && (
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#7B2CBF" />
                    <Text variant="bodyMedium" style={styles.infoText}>
                      {instructor.experience_years} Years Experience
                    </Text>
                  </View>
                )}
                {instructor.specialization && (
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="star" size={20} color="#7B2CBF" />
                    <Text variant="bodyMedium" style={styles.infoText}>
                      {instructor.specialization}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Gallery */}
            {instructor.gallery_urls && instructor.gallery_urls.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Gallery
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryContent}
                >
                  {instructor.gallery_urls.map((url, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleImagePress(index + 1)}
                      activeOpacity={0.8}
                      style={styles.galleryItem}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Videos */}
            {instructor.video_urls && instructor.video_urls.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Videos
                </Text>
                <Text variant="bodyMedium" style={styles.videoNote}>
                  Video playback will be available soon
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <ImageViewing
        images={galleryImages}
        imageIndex={selectedImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        presentationStyle="overFullScreen"
      />
    </>
  )
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#7B2CBF',
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  name: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  legacyLabel: {
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  rankBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  rank: {
    color: '#7B2CBF',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  description: {
    color: '#1A1A1A',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  infoText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  galleryContent: {
    gap: 12,
    paddingRight: 16,
  },
  galleryItem: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  videoNote: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
})

