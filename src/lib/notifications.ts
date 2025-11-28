import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { logger } from './logger'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export type NotificationFrequency = 5 | 10 | 15 | 30 | 60 // minutes

export interface NotificationConfig {
  enabled: boolean
  frequency: NotificationFrequency
  showStudentNames: boolean
  showWhenNoActivity: boolean
}

export const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  frequency: 10,
  showStudentNames: true,
  showWhenNoActivity: false,
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      logger.warn('Notification permissions not granted')
      return false
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('dojo-updates', {
        name: 'Dojo Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7B2CBF',
      })
    }

    return true
  } catch (error) {
    logger.error('Error requesting notification permissions', error as Error)
    return false
  }
}

/**
 * Send a custom notification
 */
export async function sendNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const notificationId = `notification_${Date.now()}`
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
      identifier: notificationId,
    })

    logger.info('Notification sent', { title })
  } catch (error) {
    logger.error('Error sending notification', error as Error)
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch (error) {
    logger.error('Error canceling notifications', error as Error)
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync()
  } catch (error) {
    logger.error('Error getting badge count', error as Error)
    return 0
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count)
  } catch (error) {
    logger.error('Error setting badge count', error as Error)
  }
}

/**
 * Clear notification badge
 */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0)
  } catch (error) {
    logger.error('Error clearing badge', error as Error)
  }
}


