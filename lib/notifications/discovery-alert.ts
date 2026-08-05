import * as Notifications from 'expo-notifications'

const RARITY_EMOJI: Record<string, string> = {
  common: '🔵', uncommon: '🟢', rare: '🔷', epic: '🟣', legendary: '🟡',
}

export async function showDiscoveryAlert(name: string, rarity: string, enabled: boolean) {
  if (!enabled) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${RARITY_EMOJI[rarity] ?? '✦'} Temuan baru: ${rarity.toUpperCase()}`,
      body: `Kamu menemukan "${name}"`,
      ...(process.env.EXPO_OS === 'android' ? { channelId: 'discovery' } : {}),
    },
    trigger: null, // null = tampil segera
  })
}