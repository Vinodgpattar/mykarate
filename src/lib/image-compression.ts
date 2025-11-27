import * as FileSystem from 'expo-file-system/legacy'
import * as ImageManipulator from 'expo-image-manipulator'
import { logger } from './logger'

// Compression settings for different image types
const PROFILE_IMAGE_MAX_SIZE = 300 * 1024 // 300KB for profile images
const DOCUMENT_IMAGE_MAX_SIZE = 500 * 1024 // 500KB for documents (Aadhar cards)
const NOTIFICATION_IMAGE_MAX_SIZE = 400 * 1024 // 400KB for notification images
const MAX_IMAGE_WIDTH = 1920 // Max width for images
const MAX_IMAGE_HEIGHT = 1920 // Max height for images
const DEFAULT_COMPRESSION_QUALITY = 0.8 // Compression quality (0-1)
const MIN_COMPRESSION_QUALITY = 0.3 // Minimum quality before giving up

export type ImageType = 'profile' | 'document' | 'notification'

/**
 * Compress and resize image based on type
 */
export async function compressImage(
  imageUri: string,
  type: ImageType = 'profile'
): Promise<{ uri: string; size: number; originalSize: number }> {
  try {
    // Get original image info
    const originalInfo = await FileSystem.getInfoAsync(imageUri)
    const originalSize = originalInfo.size || 0

    // Determine max size based on type
    const maxSize = 
      type === 'profile' ? PROFILE_IMAGE_MAX_SIZE :
      type === 'document' ? DOCUMENT_IMAGE_MAX_SIZE :
      NOTIFICATION_IMAGE_MAX_SIZE

    // First, resize if needed
    let manipulatedUri = imageUri
    let quality = DEFAULT_COMPRESSION_QUALITY

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
    while (compressedSize > maxSize && quality > MIN_COMPRESSION_QUALITY) {
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
      type,
      originalSize,
      compressedSize,
      quality: quality.toFixed(2),
      reduction: `${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`,
    })

    return { uri: manipulatedUri, size: compressedSize, originalSize }
  } catch (error) {
    logger.error('Error compressing image', error as Error)
    // Return original if compression fails
    const info = await FileSystem.getInfoAsync(imageUri)
    return { uri: imageUri, size: info.size || 0, originalSize: info.size || 0 }
  }
}

