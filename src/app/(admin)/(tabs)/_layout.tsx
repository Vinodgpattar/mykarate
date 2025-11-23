import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function AdminTabsLayout() {
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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="branches"
        options={{
          title: 'Branches',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="office-building" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="create-branch"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="edit-branch"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="assign-admin"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="create-student"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="student-profile"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="edit-student"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  )
}

