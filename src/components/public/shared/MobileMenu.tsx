import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView, Animated } from 'react-native'
import { Text, IconButton, Divider } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface MobileMenuProps {
  visible: boolean
  onClose: () => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320)

export function MobileMenu({ visible, onClose }: MobileMenuProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(MENU_WIDTH)).current

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const menuItems = [
    { id: 'home', label: 'Home', icon: 'home', action: () => router.push('/(public)/') },
    { id: 'programs', label: 'Programs', icon: 'karate', action: () => router.push('/(public)/programs') },
    { id: 'gallery', label: 'Gallery', icon: 'image-multiple', action: () => router.push('/(public)/gallery') },
    { id: 'locations', label: 'Locations & Contact', icon: 'map-marker', action: () => router.push('/(public)/locations') },
  ]

  const handleLogin = () => {
    onClose()
    router.push('/(auth)/login')
  }

  const handleMenuItemPress = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Menu Drawer */}
        <Animated.View
          style={[
            styles.menu,
            {
              paddingTop: insets.top + 8,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="karate" size={28} color="#7B2CBF" />
              <Text variant="titleLarge" style={styles.menuTitle}>
                Menu
              </Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              iconColor="#1A1A1A"
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Menu Items */}
          <ScrollView
            style={styles.menuItemsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuItemsContent}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.action)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={22}
                      color="#7B2CBF"
                    />
                  </View>
                  <Text variant="bodyLarge" style={styles.menuItemText}>
                    {item.label}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Divider style={styles.divider} />

          {/* Login Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="login"
                size={20}
                color="#FFFFFF"
                style={styles.loginIcon}
              />
              <Text variant="labelLarge" style={styles.loginButtonText}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    width: MENU_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 22,
  },
  closeButton: {
    margin: 0,
  },
  divider: {
    marginHorizontal: 20,
    marginVertical: 8,
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItemsContent: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B2CBF',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})

