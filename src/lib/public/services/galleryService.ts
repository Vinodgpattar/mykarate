import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import * as FileSystem from 'expo-file-system/legacy'
import * as ImageManipulator from 'expo-image-manipulator'
import type { PublicGalleryItem } from '../types/public.types'

const MAX_IMAGES = 20
const MAX_VIDEOS = 10 // Increased from 5 to 10
const MAX_IMAGE_SIZE = 500 * 1024 // 500KB - target size after compression
const MAX_VIDEO_SIZE = 10 * 1024 * 1024 // 10MB - increased for videos
const MAX_IMAGE_WIDTH = 1920 // Max width for images
const MAX_IMAGE_HEIGHT = 1920 // Max height for images
const IMAGE_COMPRESSION_QUALITY = 0.8 // Compression quality (0-1)

/**
 * Compress and resize image to meet size requirements
 */
async function compressImage(
  imageUri: string
): Promise<{ uri: string; size: number }> {
  try {
    // Get original image info
    const originalInfo = await FileSystem.getInfoAsync(imageUri)
    const originalSize = originalInfo.size || 0

    // First, resize if needed
    let manipulatedUri = imageUri
    let quality = IMAGE_COMPRESSION_QUALITY

    // Resize image if dimensions are too large
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
            height: MAX_IMAGE_HEIGHT,
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    )

    manipulatedUri = manipulated.uri

    // Check if compressed size is acceptable
    let compressedInfo = await FileSystem.getInfoAsync(manipulatedUri)
    let compressedSize = compressedInfo.size || 0

    // If still too large, reduce quality iteratively
    while (compressedSize > MAX_IMAGE_SIZE && quality > 0.3) {
      quality -= 0.1
      const recompressed = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: MAX_IMAGE_WIDTH,
              height: MAX_IMAGE_HEIGHT,
            },
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      manipulatedUri = recompressed.uri
      compressedInfo = await FileSystem.getInfoAsync(manipulatedUri)
      compressedSize = compressedInfo.size || 0
    }

    logger.info('Image compressed', {
      originalSize,
      compressedSize,
      quality: quality.toFixed(2),
    })

    return { uri: manipulatedUri, size: compressedSize }
  } catch (error) {
    logger.error('Error compressing image', error as Error)
    // Return original if compression fails
    const info = await FileSystem.getInfoAsync(imageUri)
    return { uri: imageUri, size: info.size || 0 }
  }
}

/**
 * Upload gallery image to Supabase Storage
 */
export async function uploadGalleryImage(
  imageUri: string,
  uploadedBy: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    if (!supabaseAdmin) {
      return { url: null, error: new Error('Service role key not configured') }
    }

    // Check bucket exists
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
      logger.error('Error checking storage buckets', bucketError as Error)
      return { url: null, error: new Error('Failed to access storage') }
    }

    const bucketExists = buckets?.some((b) => b.id === 'public-assets')
    if (!bucketExists) {
      return {
        url: null,
        error: new Error(
          'Storage bucket "public-assets" not found. Please create it in Supabase Dashboard → Storage.'
        ),
      }
    }

    // Check current image count
    const { count: imageCount } = await supabase
      .from('public_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'image')
      .eq('is_active', true)

    if ((imageCount || 0) >= MAX_IMAGES) {
      return {
        url: null,
        error: new Error(`Maximum ${MAX_IMAGES} images allowed in gallery`),
      }
    }

    // Compress image before upload
    onProgress?.(10, 'Compressing image...')
    logger.info('Compressing image before upload...')
    const { uri: compressedUri, size: compressedSize } = await compressImage(imageUri)
    onProgress?.(30, 'Image compressed, preparing upload...')

    // Check if compressed size is acceptable (should be, but double-check)
    if (compressedSize > MAX_IMAGE_SIZE * 1.5) {
      // Allow 50% tolerance
      logger.warn('Compressed image still large', { size: compressedSize })
    }

    // Read compressed file
    onProgress?.(40, 'Reading file...')
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Convert to ArrayBuffer
    onProgress?.(50, 'Preparing upload...')
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Generate filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `public-gallery/images/img-${timestamp}-${random}.jpg`
    const filePath = filename

    // Upload to storage
    onProgress?.(60, 'Uploading to server...')
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('public-assets')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      logger.error('Error uploading image', uploadError as Error)
      return { url: null, error: new Error(uploadError.message) }
    }

    // Get public URL
    onProgress?.(90, 'Finalizing...')
    const { data: urlData } = supabaseAdmin.storage
      .from('public-assets')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return { url: null, error: new Error('Failed to get image URL') }
    }

    onProgress?.(100, 'Upload complete!')
    logger.info('Gallery image uploaded successfully', {
      url: urlData.publicUrl,
      originalSize: (await FileSystem.getInfoAsync(imageUri)).size,
      compressedSize,
    })
    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading gallery image', error as Error)
    return {
      url: null,
      error: error instanceof Error ? error : new Error('Failed to upload image'),
    }
  }
}

/**
 * Upload gallery video to Supabase Storage
 */
export async function uploadGalleryVideo(
  videoUri: string,
  uploadedBy: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ url: string | null; thumbnailUrl: string | null; error: Error | null }> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    if (!supabaseAdmin) {
      return { url: null, thumbnailUrl: null, error: new Error('Service role key not configured') }
    }

    // Check bucket exists
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
      logger.error('Error checking storage buckets', bucketError as Error)
      return { url: null, thumbnailUrl: null, error: new Error('Failed to access storage') }
    }

    const bucketExists = buckets?.some((b) => b.id === 'public-assets')
    if (!bucketExists) {
      return {
        url: null,
        thumbnailUrl: null,
        error: new Error(
          'Storage bucket "public-assets" not found. Please create it in Supabase Dashboard → Storage.'
        ),
      }
    }

    // Check current video count
    const { count: videoCount } = await supabase
      .from('public_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'video')
      .eq('is_active', true)

    if ((videoCount || 0) >= MAX_VIDEOS) {
      return {
        url: null,
        thumbnailUrl: null,
        error: new Error(`Maximum ${MAX_VIDEOS} videos allowed in gallery`),
      }
    }

    // Read file
    onProgress?.(10, 'Reading video file...')
    const fileInfo = await FileSystem.getInfoAsync(videoUri)
    if (!fileInfo.exists || !fileInfo.size) {
      return { url: null, thumbnailUrl: null, error: new Error('Video file not found') }
    }

    // Check file size (warn but allow larger files - compression happens on client via ImagePicker quality)
    if (fileInfo.size > MAX_VIDEO_SIZE) {
      logger.warn('Video size exceeds recommended limit', {
        size: fileInfo.size,
        maxSize: MAX_VIDEO_SIZE,
      })
      // Don't block upload, but log warning
    }

    onProgress?.(20, 'Preparing video for upload...')
    const videoData = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Convert to ArrayBuffer
    onProgress?.(40, 'Processing video data...')
    const binaryString = atob(videoData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Generate filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `public-gallery/videos/video-${timestamp}-${random}.mp4`
    const filePath = filename

    // Upload to storage
    onProgress?.(50, 'Uploading video to server...')
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('public-assets')
      .upload(filePath, bytes.buffer, {
        contentType: 'video/mp4',
        upsert: false,
      })

    if (uploadError) {
      logger.error('Error uploading video', uploadError as Error)
      return { url: null, thumbnailUrl: null, error: new Error(uploadError.message) }
    }

    // Get public URL
    onProgress?.(90, 'Finalizing...')
    const { data: urlData } = supabaseAdmin.storage
      .from('public-assets')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return { url: null, thumbnailUrl: null, error: new Error('Failed to get video URL') }
    }

    // TODO: Generate thumbnail from video (can be done later)
    // For now, return null for thumbnail
    onProgress?.(100, 'Upload complete!')
    logger.info('Gallery video uploaded successfully', {
      url: urlData.publicUrl,
      size: fileInfo.size,
    })
    return { url: urlData.publicUrl, thumbnailUrl: null, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading gallery video', error as Error)
    return {
      url: null,
      thumbnailUrl: null,
      error: error instanceof Error ? error : new Error('Failed to upload video'),
    }
  }
}

/**
 * Create gallery item in database
 */
export async function createGalleryItem(data: {
  media_type: 'image' | 'video'
  title?: string
  file_url: string
  thumbnail_url?: string
  is_featured?: boolean
  uploaded_by: string
}): Promise<{ item: PublicGalleryItem | null; error: Error | null }> {
  try {
    const { data: item, error } = await supabase
      .from('public_gallery')
      .insert({
        media_type: data.media_type,
        title: data.title || null,
        file_url: data.file_url,
        thumbnail_url: data.thumbnail_url || null,
        is_featured: data.is_featured || false,
        is_active: true,
        uploaded_by: data.uploaded_by,
        order_index: 0,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating gallery item', error as Error)
      return { item: null, error: new Error(error.message) }
    }

    return { item: item as PublicGalleryItem, error: null }
  } catch (error) {
    logger.error('Unexpected error creating gallery item', error as Error)
    return {
      item: null,
      error: error instanceof Error ? error : new Error('Failed to create gallery item'),
    }
  }
}

/**
 * Delete gallery item
 */
export async function deleteGalleryItem(
  itemId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Get item to get file URL for deletion
    const { data: item, error: fetchError } = await supabase
      .from('public_gallery')
      .select('file_url, thumbnail_url')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      return { success: false, error: new Error('Gallery item not found') }
    }

    // Delete from database (soft delete - set is_active to false)
    const { error: deleteError } = await supabase
      .from('public_gallery')
      .update({ is_active: false })
      .eq('id', itemId)

    if (deleteError) {
      logger.error('Error deleting gallery item', deleteError as Error)
      return { success: false, error: new Error(deleteError.message) }
    }

    // Try to delete file from storage (non-blocking)
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      if (supabaseAdmin && item.file_url) {
        // Extract path from URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/public-assets/public-gallery/images/img-123.jpg
        // We need: public-gallery/images/img-123.jpg
        const urlParts = item.file_url.split('/public-assets/')
        if (urlParts.length > 1) {
          // Remove query parameters if any
          const pathWithQuery = urlParts[1].split('?')[0]
          const filePath = pathWithQuery.startsWith('public-gallery/') 
            ? pathWithQuery 
            : `public-gallery/${pathWithQuery}`
          
          const { error: removeError } = await supabaseAdmin.storage
            .from('public-assets')
            .remove([filePath])
          
          if (removeError) {
            logger.warn('Failed to delete file from storage', { filePath, error: removeError })
          } else {
            logger.info('Deleted gallery file from storage', { filePath })
          }
        }
        
        // Also delete thumbnail if it exists
        if (item.thumbnail_url) {
          const thumbUrlParts = item.thumbnail_url.split('/public-assets/')
          if (thumbUrlParts.length > 1) {
            const thumbPathWithQuery = thumbUrlParts[1].split('?')[0]
            const thumbPath = thumbPathWithQuery.startsWith('public-gallery/')
              ? thumbPathWithQuery
              : `public-gallery/${thumbPathWithQuery}`
            
            await supabaseAdmin.storage.from('public-assets').remove([thumbPath])
            logger.info('Deleted gallery thumbnail from storage', { thumbPath })
          }
        }
      }
    } catch (storageError) {
      logger.warn('Failed to delete gallery file from storage', { error: storageError })
      // Don't fail the operation if storage deletion fails
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting gallery item', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete gallery item'),
    }
  }
}

/**
 * Update gallery item
 */
export async function updateGalleryItem(
  itemId: string,
  updates: {
    title?: string
    is_featured?: boolean
    order_index?: number
  }
): Promise<{ item: PublicGalleryItem | null; error: Error | null }> {
  try {
    const { data: item, error } = await supabase
      .from('public_gallery')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating gallery item', error as Error)
      return { item: null, error: new Error(error.message) }
    }

    return { item: item as PublicGalleryItem, error: null }
  } catch (error) {
    logger.error('Unexpected error updating gallery item', error as Error)
    return {
      item: null,
      error: error instanceof Error ? error : new Error('Failed to update gallery item'),
    }
  }
}

/**
 * Get all gallery items (for admin)
 */
export async function getAllGalleryItems(): Promise<{
  items: PublicGalleryItem[]
  error: null
} | {
  items: null
  error: Error
}> {
  try {
    const { data, error } = await supabase
      .from('public_gallery')
      .select('*')
      .eq('is_active', true) // Only show active items in admin panel
      .order('is_featured', { ascending: false })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching gallery items', error as Error)
      return { items: null, error: new Error(error.message) }
    }

    return { items: (data as PublicGalleryItem[]) || [], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching gallery items', error as Error)
    return {
      items: null,
      error: error instanceof Error ? error : new Error('Failed to fetch gallery items'),
    }
  }
}

