import { supabase } from '@/lib/supabase'
import { groupSnapsByPhoto } from '@/lib/snaps/collection'

export type Stats = {
  active_days: number
  current_streak: number
  longest_streak: number
  total_snaps: number
  rarest_rarity: string | null
  rarity_count: Record<string, number>
  top_category: string | null
  discovery_index: number
  total_memories: number
  snap_of_month: { name: string; rarity: string } | null
  favorite_time: 'pagi' | 'siang' | 'malam' | null
  avg_upload_hour: number | null
}

function timeOfDay(hour: number): 'pagi' | 'siang' | 'malam' {
  if (hour >= 5 && hour < 11) return 'pagi'
  if (hour >= 11 && hour < 18) return 'siang'
  return 'malam'
}

export async function fetchStats(userId: string): Promise<Stats> {
  const { data: photos } = await supabase
    .from('photos')
    .select('date_taken, created_at')
    .eq('user_id', userId)
    .order('date_taken', { ascending: true })

  const { data: snaps } = await supabase
    .from('snaps')
    .select('current_rarity, global_rarity, common_name_en, category, created_at, is_main, photo_id')
    .eq('user_id', userId)
    .eq('is_main', true)

  const { data: memories } = await supabase.from('memories').select('id').eq('user_id', userId)

  const photoList = photos ?? []
  const collectionSnaps = groupSnapsByPhoto(snaps ?? [])

  const activeDays = new Set(photoList.map(p => p.date_taken)).size

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  const sortedDates = [...new Set(photoList.map(p => p.date_taken))].sort()

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1
    } else {
      const diff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000
      tempStreak = diff === 1 ? tempStreak + 1 : 1
    }
    longestStreak = Math.max(longestStreak, tempStreak)
  }

  const today = new Date()
  if (sortedDates.length > 0) {
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0]
    if (sortedDates[sortedDates.length - 1] === todayStr || sortedDates[sortedDates.length - 1] === yesterdayStr) {
      currentStreak = tempStreak
    }
  }

  const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common']
  const rarityCount: Record<string, number> = {}
  for (const snap of collectionSnaps) rarityCount[snap.current_rarity] = (rarityCount[snap.current_rarity] ?? 0) + 1
  const rarestRarity = rarityOrder.find(r => rarityCount[r] > 0) ?? null

  const categoryCount: Record<string, number> = {}
  for (const snap of collectionSnaps) {
    if (snap.category) categoryCount[snap.category] = (categoryCount[snap.category] ?? 0) + 1
  }
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const thisMonth = today.toISOString().slice(0, 7)
  const monthSnaps = collectionSnaps.filter(s => s.created_at.startsWith(thisMonth))
  const rarityScore: Record<string, number> = { legendary: 100, epic: 60, rare: 30, uncommon: 15, common: 5 }
  const discoveryIndex = monthSnaps.reduce((acc, s) => acc + (rarityScore[s.current_rarity] ?? 0), 0)

  const snapOfMonth = monthSnaps
    .slice()
    .sort((a, b) => (rarityScore[b.current_rarity] ?? 0) - (rarityScore[a.current_rarity] ?? 0))[0]
  const snapOfMonthResult = snapOfMonth ? { name: snapOfMonth.common_name_en, rarity: snapOfMonth.current_rarity } : null

  const uploadHours = photoList.map(p => new Date(p.created_at).getHours())
  const favoriteTime = uploadHours.length > 0
    ? (() => {
        const counts = { pagi: 0, siang: 0, malam: 0 }
        for (const h of uploadHours) counts[timeOfDay(h)]++
        return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as 'pagi' | 'siang' | 'malam')
      })()
    : null
  const avgUploadHour = uploadHours.length > 0 ? Math.round(uploadHours.reduce((a, b) => a + b, 0) / uploadHours.length) : null

  return {
    active_days: activeDays,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_snaps: collectionSnaps.length,
    rarest_rarity: rarestRarity,
    rarity_count: rarityCount,
    top_category: topCategory,
    discovery_index: discoveryIndex,
    total_memories: memories?.length ?? 0,
    snap_of_month: snapOfMonthResult,
    favorite_time: favoriteTime,
    avg_upload_hour: avgUploadHour,
  }
}