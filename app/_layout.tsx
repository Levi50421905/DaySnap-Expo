import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding-context'
import { setupNotificationChannels, requestNotificationPermission } from '@/lib/notifications/setup'
import { scheduleDailyReminder, scheduleMonthlyRecap } from '@/lib/notifications/schedule'
import { getUserSettings } from '@/lib/settings/user-settings'
import { checkMonthEndMemoryPrompt } from '@/lib/notifications/month-end-prompt'

function RootNavigation() {
  const { session, loading: authLoading } = useAuth()
  const { needsOnboarding, loading: onboardingLoading } = useOnboarding()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboardingGroup = segments[0] === '(onboarding)'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
      return
    }

    if (onboardingLoading) return

    if (needsOnboarding && !inOnboardingGroup) {
      router.replace('/(onboarding)/home-location')
    } else if (!needsOnboarding && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)/daily')
    }
  }, [session, authLoading, needsOnboarding, onboardingLoading, segments])

  useEffect(() => {
    setupNotificationChannels()
  }, [])
  
  useEffect(() => {
    if (!session) return
  
    async function syncNotifications() {
      const granted = await requestNotificationPermission()
      if (!granted) return
  
      const settings = await getUserSettings(session!.user.id)
      if (!settings) return
  
      await scheduleDailyReminder(settings.reminder_time, settings.notif_daily_reminder)
      await scheduleMonthlyRecap(settings.notif_monthly_recap)
      await checkMonthEndMemoryPrompt(session!.user.id, settings.notif_monthly_recap)
    }
  
    syncNotifications()
  }, [session])

  if (authLoading) return null

  return <Slot />
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <StatusBar style="light" />
          <RootNavigation />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}