import { supabase } from './supabase'
import { logger } from './logger'
import type { Notification, NotificationType } from './admin-notifications'

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
    return url.replace('/notification-images/notification-images/', '/notification-images/')
  }
  
  return url
}

export interface StudentNotification extends Notification {
  read: boolean
  readAt: string | null
}

/**
 * Get notifications for a student
 */
export async function getStudentNotifications(options?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}): Promise<{ notifications: StudentNotification[]; total: number; error: null } | { notifications: null; total: 0; error: Error }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { notifications: null, total: 0, error: new Error('User not authenticated') }
    }

    let query = supabase
      .from('notification_recipients')
      .select(
        `
        *,
        notification:notifications(*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)

    if (options?.unreadOnly) {
      query = query.eq('read', false)
    }

    const limit = options?.limit || 50
    const page = options?.page || 1
    const offset = (page - 1) * limit

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching student notifications', error as Error)
      return { notifications: null, total: 0, error: new Error(error.message) }
    }

    // Transform data to include notification and read status, and fix image URLs
    // Note: Supabase returns snake_case, so we need to map image_url to imageUrl
    const notifications: StudentNotification[] =
      (data || []).map((item: any) => {
        const notification = item.notification || {}
        // Map snake_case to camelCase and fix image URL
        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          imageUrl: fixImageUrl(notification.image_url || notification.imageUrl), // Handle both formats
          createdBy: notification.created_by || notification.createdBy,
          targetType: notification.target_type || notification.targetType,
          targetBranchId: notification.target_branch_id || notification.targetBranchId,
          targetStudentIds: notification.target_student_ids || notification.targetStudentIds,
          scheduledAt: notification.scheduled_at || notification.scheduledAt,
          sentAt: notification.sent_at || notification.sentAt,
          readCount: notification.read_count || notification.readCount || 0,
          totalSent: notification.total_sent || notification.totalSent || 0,
          createdAt: notification.created_at || notification.createdAt,
          updatedAt: notification.updated_at || notification.updatedAt,
          read: item.read,
          readAt: item.read_at,
        }
      }) || []

    logger.info('Student notifications fetched', { userId: user.id, count: notifications.length, total: count || 0 })
    return { notifications, total: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student notifications', error as Error)
    return { notifications: null, total: 0, error: error instanceof Error ? error : new Error('Failed to fetch notifications') }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: new Error('User not authenticated') }
    }

    const { error } = await supabase
      .from('notification_recipients')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('notification_id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Error marking notification as read', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    logger.info('Notification marked as read', { notificationId, userId: user.id })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error marking notification as read', error as Error)
    return { success: false, error: error instanceof Error ? error : new Error('Failed to mark notification as read') }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: new Error('User not authenticated') }
    }

    const { error } = await supabase
      .from('notification_recipients')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      logger.error('Error marking all notifications as read', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    logger.info('All notifications marked as read', { userId: user.id })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error marking all notifications as read', error as Error)
    return { success: false, error: error instanceof Error ? error : new Error('Failed to mark all notifications as read') }
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{ count: number; error: null } | { count: 0; error: Error }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { count: 0, error: new Error('User not authenticated') }
    }

    const { count, error } = await supabase
      .from('notification_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      logger.error('Error getting unread count', error as Error)
      return { count: 0, error: new Error(error.message) }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error getting unread count', error as Error)
    return { count: 0, error: error instanceof Error ? error : new Error('Failed to get unread count') }
  }
}

/**
 * Register push token for user
 */
export async function registerPushToken(token: string, platform: 'ios' | 'android', deviceId?: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: new Error('User not authenticated') }
    }

    const tokenData: any = {
      user_id: user.id,
      token,
      platform,
      updated_at: new Date().toISOString(),
    }

    if (deviceId) {
      tokenData.device_id = deviceId
    }

    const { error } = await supabase.from('user_push_tokens').upsert(tokenData, {
      onConflict: 'user_id,platform,device_id',
    })

    if (error) {
      logger.error('Error registering push token', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    logger.info('Push token registered', { userId: user.id, platform })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error registering push token', error as Error)
    return { success: false, error: error instanceof Error ? error : new Error('Failed to register push token') }
  }
}

