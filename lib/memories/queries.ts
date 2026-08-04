import { supabase } from '@/lib/supabase'

export async function getMemoryForPhoto(userId: string, photoId: string) {
  const { data } = await supabase
    .from('memories')
    .select('id, title, reason')
    .eq('user_id', userId)
    .eq('photo_id', photoId)
    .maybeSingle()
  return data
}

export async function createMemory(userId: string, photoId: string, title: string, reason: string | null) {
  const { data: existing } = await supabase
    .from('memories')
    .select('id')
    .eq('user_id', userId)
    .eq('photo_id', photoId)
    .maybeSingle()

  if (existing) throw new Error('Foto ini sudah jadi Memory Anchor')

  const { data, error } = await supabase
    .from('memories')
    .insert({ user_id: userId, photo_id: photoId, title, reason })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMemory(id: string, userId: string, title: string, reason: string | null) {
  const { data, error } = await supabase
    .from('memories')
    .update({ title, reason })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMemory(id: string, userId: string) {
  const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}