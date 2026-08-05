import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY_PREFIX = 'daysnap-month-end-shown-'

function isNearMonthEnd(date: Date): boolean {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return date.getDate() >= lastDay - 2 // 3 hari terakhir bulan itu
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function checkMonthEndMemoryPrompt(userId: string, enabled: boolean) {
  if (!enabled) return

  const now = new Date()
  if (!isNearMonthEnd(now)) return

  const key = `${STORAGE_KEY_PREFIX}${userId}-${monthKey(now)}`

  // Cek udah pernah ditampilkan bulan ini via AsyncStorage
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default
  const alreadyShown = await AsyncStorage.getItem(key)
  if (alreadyShown) return

  // Cek apakah user sudah punya memory anchor bulan ini
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count } = await supabase
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth)

  if ((count ?? 0) > 0) {
    await AsyncStorage.setItem(key, 'true')
    return
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Bulan ini belum ada Memory Anchor 🕯️',
      body: 'Ada momen yang pengen kamu tandai sebelum bulan berganti?',
      ...(process.env.EXPO_OS === 'android' ? { channelId: 'discovery' } : {}),
    },
    trigger: null,
  })

  await AsyncStorage.setItem(key, 'true')
}