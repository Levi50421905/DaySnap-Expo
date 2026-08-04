import { supabase } from '@/lib/supabase'

export async function getSnapForPhoto(userId: string, photoId: string) {
  const { data } = await supabase
    .from('snaps')
    .select('id, common_name_en, current_rarity')
    .eq('user_id', userId)
    .eq('photo_id', photoId)
    .eq('is_main', true)
    .maybeSingle()
  return data
}