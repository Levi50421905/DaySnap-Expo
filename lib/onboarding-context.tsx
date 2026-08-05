import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth-context'

type OnboardingContextType = {
  needsOnboarding: boolean
  loading: boolean
  refresh: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session) {
      setNeedsOnboarding(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('home_location')
        .eq('user_id', session.user.id)
        .single()
  
      if (error) {
        console.warn('[onboarding] fetch error', error)
        setNeedsOnboarding(false) // fail-safe: jangan block user ke onboarding kalau network/auth lagi error
      } else {
        setNeedsOnboarding(!data?.home_location)
      }
    } catch (err) {
      console.warn('[onboarding] unexpected error', err)
      setNeedsOnboarding(false)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { refresh() }, [refresh])

  return (
    <OnboardingContext.Provider value={{ needsOnboarding, loading, refresh }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}