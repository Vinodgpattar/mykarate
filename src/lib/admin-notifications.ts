import { supabase, supabaseAdmin } from './supabase'
import { logger } from './logger'
import * as FileSystem from 'expo-file-system/legacy'
import { compressImage } from './image-compression'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'

export type NotificationType = 'announcement' | 'alert' | 'reminder' | 'achievement' | 'event' | 'payment' | 'class' | 'system'
export type TargetType = 'all' | 'branch' | 'students'

/**
 * Fix image URL if it has duplicate bucket name in path
 * This handles URLs created before the path fix
 */
function fixImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // Check if URL has duplicate 'notification-images' in path
  // Pattern: .../notification-images/notification-images/...
  const duplicatePattern = /\/notification-images\/notification-images\//
  if (duplicatePattern.test(url)) {
    // Remove the duplicate bucket name
    const fixed = url.replace('/notification-images/notification-images/', '/notification-images/')
    logger.info('Fixed duplicate bucket name in image URL', { original: url, fixed })
    return fixed
  }
  
  return url
}

export interface CreateNotificationData {
  title: string
  message: string
  type: NotificationType
  imageUri?: string // Local file URI from image picker
  targetType: TargetType
  targetBranchId?: string
  targetStudentIds?: string[]
  scheduledAt?: Date
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  imageUrl: string | null
  createdBy: string
  targetType: TargetType
  targetBranchId: string | null
  targetStudentIds: string[] | null
  scheduledAt: string | null
  sentAt: string | null
  readCount: number
  totalSent: number
  createdAt: string
  updatedAt: string
}

export interface NotificationRecipient {
  id: string
  notificationId: string
  userId: string
  read: boolean
  readAt: string | null
  pushSent: boolean
  pushSentAt: string | null
  user?: {
    email: string
    role: string
  }
  student?: {
    first_name: string
    last_name: string
    student_id: string
  } | null
}

/**
 * Calculate recipients based on target type
 */
async function calculateRecipients(
  targetType: TargetType,
  targetBranchId?: string,
  targetStudentIds?: string[]
): Promise<{ userIds: string[]; studentCount: number }> {
  try {
    let userIds: string[] = []

    if (targetType === 'all') {
      // Get all active students
      const { data: students, error } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('is_active', true)
        .not('user_id', 'is', null)

      if (error) {
        logger.error('Error fetching all students', error as Error)
        return { userIds: [], studentCount: 0 }
      }

      userIds = (students || []).map((s) => s.user_id).filter((id): id is string => !!id)
    } else if (targetType === 'branch' && targetBranchId) {
      // Get students from specific branch
      const { data: students, error } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('branch_id', targetBranchId)
        .eq('is_active', true)
        .not('user_id', 'is', null)

      if (error) {
        logger.error('Error fetching branch students', error as Error)
        return { userIds: [], studentCount: 0 }
      }

      userIds = (students || []).map((s) => s.user_id).filter((id): id is string => !!id)
    } else if (targetType === 'students' && targetStudentIds && targetStudentIds.length > 0) {
      // Get specific students
      const { data: students, error } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .in('id', targetStudentIds)
        .eq('is_active', true)
        .not('user_id', 'is', null)

      if (error) {
        logger.error('Error fetching specific students', error as Error)
        return { userIds: [], studentCount: 0 }
      }

      userIds = (students || []).map((s) => s.user_id).filter((id): id is string => !!id)
    }

    logger.info('Recipients calculated', { targetType, count: userIds.length, studentCount: userIds.length })
    return { userIds, studentCount: userIds.length }
  } catch (error) {
    logger.error('Unexpected error calculating recipients', error as Error)
    return { userIds: [], studentCount: 0 }
  }
}

/**
 * Upload notification image to Supabase Storage
 * Uses the same pattern as mess-management-mobile app
 */
export async function uploadNotificationImage(imageUri: string, notificationId: string): Promise<{ url: string | null; error: Error | null }> {
  try {
    if (!supabaseAdmin) {
      return { url: null, error: new Error('Service role key not configured') }
    }

    // Check if storage bucket exists
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
      logger.error('Error checking storage buckets', bucketError as Error)
      return { url: null, error: new Error('Failed to access storage') }
    }

    const bucketExists = buckets?.some((b) => b.id === 'notification-images')
    if (!bucketExists) {
      return { 
        url: null, 
        error: new Error(
          'Storage bucket "notification-images" not found. Please create it in Supabase Dashboard → Storage.'
        ) 
      }
    }

    // Compress image before upload
    logger.info('Compressing notification image before upload...')
    const { uri: compressedUri, size: compressedSize, originalSize } = await compressImage(imageUri, 'notification')
    logger.info('Notification image compressed', {
      originalSize,
      compressedSize,
      reduction: `${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`,
    })

    // Read compressed file as ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Generate unique filename - put all images in one folder (not per notification)
    // Format: notifications/{timestamp}_{random}.jpg
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `notifications/${timestamp}_${random}.jpg`
    // File path should NOT include bucket name - just the path within the bucket
    const filePath = filename

    // Upload to Supabase Storage using ArrayBuffer
    const { data: uploadData, error } = await supabaseAdmin.storage.from('notification-images').upload(filePath, bytes.buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    })

    if (error) {
      logger.error('Error uploading image to storage', error as Error)
      return { url: null, error: new Error(error.message) }
    }

    // Use the path returned by Supabase (it's already relative to the bucket)
    // Supabase returns the full path including any folders, so we use it directly
    const uploadedPath = uploadData?.path || filePath
    
    logger.info('Image upload path', { 
      notificationId, 
      filePath, 
      uploadedPath: uploadData?.path,
      fullPath: uploadData?.fullPath 
    })

    // Get public URL using the path returned from upload
    const { data: urlData } = supabaseAdmin.storage.from('notification-images').getPublicUrl(uploadedPath)

    if (!urlData?.publicUrl) {
      logger.error('Failed to get public URL', new Error('URL data is null'), { uploadedPath })
      return { url: null, error: new Error('Failed to get public URL') }
    }

    logger.info('Notification image uploaded', { notificationId, url: urlData.publicUrl, path: uploadedPath })
    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading image', error as Error)
    return { url: null, error: error instanceof Error ? error : new Error('Failed to upload image') }
  }
}

/**
 * Request image picker permissions
 */
export async function requestImagePickerPermissions(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      return false
    }
    return true
  } catch (error) {
    logger.error('Error requesting permissions', error as Error)
    return false
  }
}

/**
 * Pick image from gallery
 * (Same pattern as mess-management-mobile)
 */
export async function pickImageFromGallery(): Promise<{ uri: string | null; error: null } | { uri: null; error: Error }> {
  try {
    const hasPermission = await requestImagePickerPermissions()
    if (!hasPermission) {
      return { uri: null, error: new Error('Permission to access media library is required') }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (result.canceled) {
      // User canceled - return null without error
      return { uri: null, error: null }
    }

    if (result.assets && result.assets.length > 0) {
      return { uri: result.assets[0].uri, error: null }
    }

    return { uri: null, error: new Error('No image selected') }
  } catch (error) {
    logger.error('Error picking image', error as Error)
    return {
      uri: null,
      error: error instanceof Error ? error : new Error('Failed to pick image'),
    }
  }
}

/**
 * Take photo with camera
 * (Same pattern as mess-management-mobile)
 */
export async function takePhotoWithCamera(): Promise<{ uri: string | null; error: null } | { uri: null; error: Error }> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      return { uri: null, error: new Error('Permission to access camera is required') }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (result.canceled) {
      // User canceled - return null without error
      return { uri: null, error: null }
    }

    if (result.assets && result.assets.length > 0) {
      return { uri: result.assets[0].uri, error: null }
    }

    return { uri: null, error: new Error('No photo captured') }
  } catch (error) {
    logger.error('Error taking photo', error as Error)
    return {
      uri: null,
      error: error instanceof Error ? error : new Error('Failed to take photo'),
    }
  }
}

/**
 * Send Expo push notification
 * Returns array of successful token indices
 */
export async function sendExpoPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number; successfulIndices: number[] }> {
  try {
    if (tokens.length === 0) {
      return { sent: 0, failed: 0, successfulIndices: [] }
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      logger.error('Expo push API error', new Error(`HTTP ${response.status}: ${response.statusText}`))
      return { sent: 0, failed: tokens.length, successfulIndices: [] }
    }

    const result = await response.json()
    
    // Handle different response formats
    let receipts: any[] = []
    if (Array.isArray(result.data)) {
      receipts = result.data
    } else if (result.data) {
      receipts = [result.data]
    } else if (Array.isArray(result)) {
      receipts = result
    } else {
      logger.warn('Unexpected Expo push response format', { result })
      return { sent: 0, failed: tokens.length, successfulIndices: [] }
    }

    const successfulIndices: number[] = []
    let sent = 0
    let failed = 0

    receipts.forEach((receipt: any, index: number) => {
      // Receipt can have status: 'ok' or error details
      if (receipt.status === 'ok' || (receipt.status && receipt.status.includes('ok'))) {
        sent++
        successfulIndices.push(index)
      } else {
        failed++
        logger.warn('Push notification failed', { 
          index, 
          token: tokens[index]?.substring(0, 20) + '...', 
          error: receipt.message || receipt.error || receipt.status 
        })
      }
    })

    logger.info('Push notifications sent', { total: tokens.length, sent, failed })
    return { sent, failed, successfulIndices }
  } catch (error) {
    logger.error('Error sending push notifications', error as Error)
    return { sent: 0, failed: tokens.length, successfulIndices: [] }
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  data: CreateNotificationData,
  createdBy: string
): Promise<{ notification: Notification | null; error: Error | null }> {
  try {
    if (!supabaseAdmin) {
      return { notification: null, error: new Error('Service role key not configured') }
    }

    // Calculate recipients
    const { userIds, studentCount } = await calculateRecipients(data.targetType, data.targetBranchId, data.targetStudentIds)

    if (studentCount === 0) {
      return { notification: null, error: new Error('No recipients found for the selected target') }
    }

    // Prepare notification data
    const notificationData: any = {
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      created_by: createdBy,
      target_type: data.targetType,
      target_branch_id: data.targetBranchId || null,
      target_student_ids: data.targetStudentIds && data.targetStudentIds.length > 0 ? data.targetStudentIds : null,
      scheduled_at: data.scheduledAt ? data.scheduledAt.toISOString() : null,
      total_sent: studentCount,
      read_count: 0,
    }

    // Create notification
    const { data: notification, error: createError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (createError || !notification) {
      logger.error('Error creating notification', createError as Error)
      
      // Check if it's a schema error (migration not run)
      if (createError?.code === 'PGRST204' || createError?.message?.includes('schema cache') || createError?.message?.includes('column')) {
        return {
          notification: null,
          error: new Error(
            'Database migration not run. Please run the migration file: prisma/migrations/006_create_notifications_system.sql in Supabase SQL Editor.'
          ),
        }
      }
      
      return { notification: null, error: new Error(createError?.message || 'Failed to create notification') }
    }

    // Upload image if provided
    let imageUrl: string | null = null
    if (data.imageUri) {
      const uploadResult = await uploadNotificationImage(data.imageUri, notification.id)
      if (uploadResult.url) {
        imageUrl = uploadResult.url
        // Update notification with image URL
        await supabaseAdmin
          .from('notifications')
          .update({ image_url: imageUrl })
          .eq('id', notification.id)
      } else {
        logger.warn('Notification created but image upload failed', uploadResult.error)
      }
    }

    // Create recipient records
    const recipientRecords = userIds.map((userId) => ({
      notification_id: notification.id,
      user_id: userId,
      read: false,
      push_sent: false,
    }))

    const { error: recipientError } = await supabaseAdmin.from('notification_recipients').insert(recipientRecords)

    if (recipientError) {
      logger.error('Error creating notification recipients', recipientError as Error)
      // Don't fail - notification is created
    }

    // Send push notifications
    const { data: pushTokens } = await supabaseAdmin
      .from('user_push_tokens')
      .select('user_id, token')
      .in('user_id', userIds)

    if (pushTokens && pushTokens.length > 0) {
      // Create map of token to user_id for tracking
      const tokenToUserIdMap = new Map<string, string>()
      const tokens: string[] = []
      
      pushTokens.forEach((pt: any) => {
        if (pt.token && pt.user_id) {
          tokens.push(pt.token)
          tokenToUserIdMap.set(pt.token, pt.user_id)
        }
      })

      if (tokens.length > 0) {
        const pushResult = await sendExpoPushNotification(tokens, data.title, data.message, {
          notificationId: notification.id,
          type: data.type,
        })

        // Update push_sent status for users whose tokens succeeded
        if (pushResult.successfulIndices.length > 0) {
          const successfulUserIds: string[] = []
          pushResult.successfulIndices.forEach((index) => {
            const token = tokens[index]
            const userId = tokenToUserIdMap.get(token)
            if (userId) {
              successfulUserIds.push(userId)
            }
          })

          if (successfulUserIds.length > 0) {
            await supabaseAdmin
              .from('notification_recipients')
              .update({ push_sent: true, push_sent_at: new Date().toISOString() })
              .eq('notification_id', notification.id)
              .in('user_id', successfulUserIds)
          }
        }
      }
    }

    // Update sent_at
    await supabaseAdmin
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notification.id)

    logger.info('Notification created successfully', { notificationId: notification.id, recipients: studentCount })
    return { notification: notification as Notification, error: null }
  } catch (error) {
    logger.error('Unexpected error creating notification', error as Error)
    return { notification: null, error: error instanceof Error ? error : new Error('Failed to create notification') }
  }
}

/**
 * Get all notifications (for admin)
 */
export async function getNotifications(options?: {
  search?: string
  type?: NotificationType
  page?: number
  limit?: number
}): Promise<{ notifications: Notification[]; total: number; error: null } | { notifications: null; total: 0; error: Error }> {
  try {
    let query = supabase.from('notifications').select('*', { count: 'exact' })

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,message.ilike.%${options.search}%`)
    }

    if (options?.type) {
      query = query.eq('type', options.type)
    }

    const limit = options?.limit || 50
    const page = options?.page || 1
    const offset = (page - 1) * limit

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching notifications', error as Error)
      return { notifications: null, total: 0, error: new Error(error.message) }
    }

    // Fix image URLs that have duplicate bucket name
    // Also map snake_case to camelCase (Supabase returns snake_case)
    const fixedNotifications = (data as any[] || []).map((n: any) => {
      // Map snake_case to camelCase
      const notification: Notification = {
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        imageUrl: fixImageUrl(n.image_url || n.imageUrl), // Handle both formats
        createdBy: n.created_by || n.createdBy,
        targetType: n.target_type || n.targetType,
        targetBranchId: n.target_branch_id || n.targetBranchId,
        targetStudentIds: n.target_student_ids || n.targetStudentIds,
        scheduledAt: n.scheduled_at || n.scheduledAt,
        sentAt: n.sent_at || n.sentAt,
        readCount: n.read_count || n.readCount || 0,
        totalSent: n.total_sent || n.totalSent || 0,
        createdAt: n.created_at || n.createdAt,
        updatedAt: n.updated_at || n.updatedAt,
      }
      
      const fixedUrl = notification.imageUrl
      if (fixedUrl && fixedUrl !== (n.image_url || n.imageUrl)) {
        // Update in database if URL was fixed (async, don't wait)
        Promise.resolve(
          supabaseAdmin
            .from('notifications')
            .update({ image_url: fixedUrl })
            .eq('id', notification.id)
        )
          .then(() => {
            logger.info('Updated notification image URL in database', { notificationId: notification.id })
          })
          .catch((err) => {
            logger.error('Error updating notification image URL', err as Error)
          })
      }
      
      return notification
    })

    return { notifications: fixedNotifications, total: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching notifications', error as Error)
    return { notifications: null, total: 0, error: error instanceof Error ? error : new Error('Failed to fetch notifications') }
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(notificationId: string): Promise<{ notification: Notification | null; error: null } | { notification: null; error: Error }> {
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('id', notificationId).single()

    if (error) {
      logger.error('Error fetching notification', error as Error)
      return { notification: null, error: new Error(error.message) }
    }

    // Fix image URL if it has duplicate bucket name
    // Also map snake_case to camelCase (Supabase returns snake_case)
    const n = data as any
    const notification: Notification = {
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      imageUrl: fixImageUrl(n.image_url || n.imageUrl), // Handle both formats
      createdBy: n.created_by || n.createdBy,
      targetType: n.target_type || n.targetType,
      targetBranchId: n.target_branch_id || n.targetBranchId,
      targetStudentIds: n.target_student_ids || n.targetStudentIds,
      scheduledAt: n.scheduled_at || n.scheduledAt,
      sentAt: n.sent_at || n.sentAt,
      readCount: n.read_count || n.readCount || 0,
      totalSent: n.total_sent || n.totalSent || 0,
      createdAt: n.created_at || n.createdAt,
      updatedAt: n.updated_at || n.updatedAt,
    }
    
    const originalUrl = n.image_url || n.imageUrl
    const fixedUrl = notification.imageUrl

    // Update in database if URL was fixed (async, don't wait)
    if (fixedUrl !== originalUrl && fixedUrl) {
      Promise.resolve(
        supabaseAdmin
          .from('notifications')
          .update({ image_url: fixedUrl })
          .eq('id', notificationId)
      )
        .then(() => {
          logger.info('Updated notification image URL in database', { notificationId })
        })
        .catch((err) => {
          logger.error('Error updating notification image URL', err as Error)
        })
    }

    return { notification, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching notification', error as Error)
    return { notification: null, error: error instanceof Error ? error : new Error('Failed to fetch notification') }
  }
}

/**
 * Get notification recipients
 */
export async function getNotificationRecipients(notificationId: string): Promise<{ recipients: NotificationRecipient[]; error: null } | { recipients: null; error: Error }> {
  try {
    // First get recipients with user info
    const { data: recipientsData, error: recipientsError } = await supabaseAdmin
      .from('notification_recipients')
      .select(
        `
        *,
        user:profiles!notification_recipients_user_id_fkey(email, role)
      `
      )
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false })

    if (recipientsError) {
      logger.error('Error fetching notification recipients', recipientsError as Error)
      return { recipients: null, error: new Error(recipientsError.message) }
    }

    // Then fetch student info for each recipient
    const recipientsWithStudents = await Promise.all(
      (recipientsData || []).map(async (recipient) => {
        if (recipient.user_id) {
          const { data: studentData } = await supabaseAdmin
            .from('students')
            .select('first_name, last_name, student_id')
            .eq('user_id', recipient.user_id)
            .maybeSingle()

          return {
            ...recipient,
            student: studentData || null,
          }
        }
        return { ...recipient, student: null }
      })
    )

    return { recipients: recipientsWithStudents as NotificationRecipient[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching recipients', error as Error)
    return { recipients: null, error: error instanceof Error ? error : new Error('Failed to fetch recipients') }
  }
}

/**
 * Delete notification
 * Also attempts to delete associated image from storage (non-blocking)
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    // Get notification to find image URL before deletion
    const { data: notification } = await supabaseAdmin
      .from('notifications')
      .select('image_url')
      .eq('id', notificationId)
      .single()

    // Delete notification (this will cascade delete recipients)
    const { error } = await supabaseAdmin.from('notifications').delete().eq('id', notificationId)

    if (error) {
      logger.error('Error deleting notification', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    // Attempt to delete image from storage (non-blocking - don't fail if this fails)
    if (notification?.image_url) {
      try {
        // Extract file path from URL
        // URL format: https://project.supabase.co/storage/v1/object/public/notification-images/path/to/file.jpg
        const url = notification.image_url
        const match = url.match(/\/notification-images\/(.+)$/)
        if (match && match[1]) {
          const filePath = match[1]
          await supabaseAdmin.storage.from('notification-images').remove([filePath])
          logger.info('Deleted notification image from storage', { notificationId, filePath })
        }
      } catch (storageError) {
        // Log but don't fail - image deletion is optional
        logger.warn('Failed to delete notification image from storage', { notificationId, error: storageError })
      }
    }

    logger.info('Notification deleted', { notificationId })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting notification', error as Error)
    return { success: false, error: error instanceof Error ? error : new Error('Failed to delete notification') }
  }
}

