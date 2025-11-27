import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Check for missing environment variables
export const hasConfigError = !supabaseUrl || !supabaseAnonKey
export const configError = hasConfigError
  ? new Error(
      __DEV__
        ? 'Missing Supabase environment variables. Please check your .env.local file.'
        : 'App configuration error. Please set environment variables in EAS Dashboard.'
    )
  : null

if (hasConfigError) {
  // Log error for debugging
  console.error('❌ Missing Supabase environment variables!')
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING')
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'MISSING')
  console.error('Please set these in EAS Dashboard → Your Project → Environment Variables')
}

// Use actual values or placeholders (placeholders will fail on API calls, but won't crash on startup)
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-key'

// ✅ Configure Supabase with AsyncStorage for session persistence in React Native
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not needed for mobile
  },
})

// Admin client for creating users (uses service role key)
// This is used for admin operations like creating auth users and profiles
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey && !hasConfigError
  ? createClient(finalUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null
