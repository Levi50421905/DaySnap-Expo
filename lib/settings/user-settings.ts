import { supabase } from '@/lib/supabase'

export type UserSettings = {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  reminder_time: string
  day_change_hour: number
  allow_pin_after_day: boolean
  timezone: string
  home_location: Record<string, any> | null
  auto_ai_detection: boolean
  show_secondary_snap: boolean
  allow_unknown_discovery: boolean
  theme: string
  accent_color: string
  calendar_start_day: string
  app_language: string
  collection_language: string
  show_scientific_names: boolean
  notif_daily_reminder: boolean
  notif_discovery: boolean
  notif_monthly_recap: boolean
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[settings] fetch error', error)
    return null
  }
  return data
}

export async function updateUserSettings(userId: string, patch: Partial<UserSettings>) {
  const { data, error } = await supabase
    .from('user_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}