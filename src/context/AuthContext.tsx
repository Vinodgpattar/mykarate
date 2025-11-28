import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    // Check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          logger.error('AuthContext: Error getting session', error)
          setLoading(false)
          return
        }
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((error) => {
        logger.error('AuthContext: Failed to get session', error)
        setLoading(false)
      })

    // Listen for auth changes with error handling
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          logger.debug('AuthContext: Auth state changed', { event, hasSession: !!session })
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )
      subscription = authSubscription
    } catch (error) {
      logger.error('AuthContext: Failed to set up auth state listener', error)
      setLoading(false)
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          logger.error('AuthContext: Error unsubscribing', error)
        }
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim()
    logger.debug('AuthContext: signIn called', { email: normalizedEmail })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      logger.error('AuthContext: signIn error', error)
      throw error
    }

    if (data?.session) {
      logger.info('AuthContext: Login successful, setting session')
      setSession(data.session)
      setUser(data.user)
      logger.debug('AuthContext: Session set', { userEmail: data.user?.email })
    } else {
      logger.error('AuthContext: No session in response', new Error('No session returned'))
      throw new Error('Failed to create session. Please try again.')
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        logger.error('AuthContext: signOut error', error)
        throw error
      }
      setSession(null)
      setUser(null)
    } catch (error) {
      logger.error('AuthContext: signOut failed', error)
      // Still clear local state even if signOut fails
      setSession(null)
      setUser(null)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



