import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import {
  requestNotificationPermissions,
  cancelAllNotifications,
  NotificationConfig,
  NotificationFrequency,
  DEFAULT_CONFIG,
} from '@/lib/notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

const NOTIFICATION_CONFIG_KEY = '@notification_config'
const NOTIFICATION_HISTORY_KEY = '@notification_history'
const MAX_HISTORY_ITEMS = 50

export interface NotificationHistoryItem {
  id: string
  title: string
  body: string
  timestamp: Date
  data?: Record<string, unknown>
}

interface NotificationContextType {
  config: NotificationConfig
  updateConfig: (config: Partial<NotificationConfig>) => Promise<void>
  isEnabled: boolean
  toggleEnabled: () => Promise<void>
  setFrequency: (frequency: NotificationFrequency) => Promise<void>
  permissionsGranted: boolean
  requestPermissions: () => Promise<boolean>
  lastNotificationTime: Date | null
  notificationHistory: NotificationHistoryItem[]
  addToHistory: (notification: NotificationHistoryItem) => Promise<void>
  clearHistory: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user } = useAuth()
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null)
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([])
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null)
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null)

  // Load config and history from storage
  useEffect(() => {
    loadConfig()
    loadHistory()
    checkPermissions()
  }, [])

  // Setup notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        console.log('Notification received:', notification)
        const now = new Date()
        setLastNotificationTime(now)
        
        // Add to history
        const historyItem: NotificationHistoryItem = {
          id: notification.request.identifier || Date.now().toString(),
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          timestamp: now,
          data: notification.request.content.data as Record<string, unknown> | undefined,
        }
        await addToHistory(historyItem)
      }
    )

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response)
        
        const data = response.notification.request.content.data
        
        // Handle navigation based on notification type
        if (data?.type === 'class_reminder') {
          router.push('/(student)/(tabs)/schedule')
        } else if (data?.type === 'belt_test') {
          router.push('/(student)/(tabs)/profile')
        } else if (data?.type === 'payment_due') {
          router.push('/(student)/(tabs)/payments')
        }
        // Add more navigation handlers as needed
      }
    )

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove()
        } catch (error) {
          console.warn('Error removing notification listener:', error)
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove()
        } catch (error) {
          console.warn('Error removing response listener:', error)
        }
      }
    }
  }, [router])

  // Register push token when user logs in and permissions are granted
  useEffect(() => {
    if (user?.id && permissionsGranted) {
      const registerPushToken = async () => {
        try {
          const projectId = 
            Constants.expoConfig?.extra?.eas?.projectId ||
            Constants.easConfig?.projectId

          if (!projectId) {
            console.warn('Expo project ID not found. Push notifications may not work. Add "extra.eas.projectId" to app.json')
            return
          }

          const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
            projectId,
          })

          if (tokenData) {
            // Save to Supabase user_push_tokens table
            // Get device ID if available
            const deviceId = await Notifications.getDevicePushTokenAsync().catch(() => null)
            
            const { error } = await supabase
              .from('user_push_tokens')
              .upsert(
                {
                  user_id: user.id,
                  token: tokenData,
                  platform: Platform.OS,
                  device_id: deviceId ? String(deviceId) : null,
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: 'user_id,platform,device_id',
                }
              )

            if (error) {
              console.error('Error saving push token:', error)
            } else {
              console.log('Push token registered successfully')
            }
          }
        } catch (error) {
          console.error('Error registering push token:', error)
        }
      }

      registerPushToken()
    }
  }, [user?.id, permissionsGranted])

  // Cancel notifications if disabled
  useEffect(() => {
    if (!config.enabled) {
      cancelAllNotifications().catch(console.error)
    }
  }, [config.enabled])

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_CONFIG_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setConfig({ ...DEFAULT_CONFIG, ...parsed })
      }
    } catch (error) {
      console.error('Error loading notification config:', error)
    }
  }

  const saveConfig = async (newConfig: NotificationConfig) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_CONFIG_KEY, JSON.stringify(newConfig))
      setConfig(newConfig)
    } catch (error) {
      console.error('Error saving notification config:', error)
    }
  }

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync()
      setPermissionsGranted(status === 'granted')
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions()
    setPermissionsGranted(granted)
    return granted
  }

  const updateConfig = async (updates: Partial<NotificationConfig>) => {
    const newConfig = { ...config, ...updates }
    await saveConfig(newConfig)
  }

  const toggleEnabled = async () => {
    await updateConfig({ enabled: !config.enabled })
  }

  const setFrequency = async (frequency: NotificationFrequency) => {
    await updateConfig({ frequency })
  }

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setNotificationHistory(history)
      }
    } catch (error) {
      console.error('Error loading notification history:', error)
    }
  }

  const saveHistory = async (history: NotificationHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history))
      setNotificationHistory(history)
    } catch (error) {
      console.error('Error saving notification history:', error)
    }
  }

  const addToHistory = async (notification: NotificationHistoryItem) => {
    try {
      const currentHistory = [...notificationHistory, notification]
      const trimmedHistory = currentHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, MAX_HISTORY_ITEMS)
      await saveHistory(trimmedHistory)
    } catch (error) {
      console.error('Error adding to notification history:', error)
    }
  }

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY)
      setNotificationHistory([])
    } catch (error) {
      console.error('Error clearing notification history:', error)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        config,
        updateConfig,
        isEnabled: config.enabled,
        toggleEnabled,
        setFrequency,
        permissionsGranted,
        requestPermissions,
        lastNotificationTime,
        notificationHistory,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}


