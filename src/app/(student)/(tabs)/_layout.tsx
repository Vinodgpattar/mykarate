import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7B2CBF',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-check" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-fees"
        options={{
          title: 'Fees',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inform-leave"
        options={{
          title: 'Leave',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens - accessible via header or navigation */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tabs - accessible via header bell icon
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tabs - accessible via header profile icon
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="complete-profile"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="create-leave-inform"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="notification-details"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  )
}


