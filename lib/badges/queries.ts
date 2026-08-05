import { supabase } from '@/lib/supabase'

export type BadgeCount = Record<string, number>

export async function fetchBadgeCounts(userId: string): Promise<BadgeCount> {
  const { data } = await supabase
    .from('snaps')
    .select('badges')
    .eq('user_id', userId)
    .eq('is_main', true)

  const counts: BadgeCount = {}
  for (const row of data ?? []) {
    for (const badge of row.badges ?? []) {
      counts[badge] = (counts[badge] ?? 0) + 1
    }
  }
  return counts
}