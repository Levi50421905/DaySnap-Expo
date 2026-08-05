import { supabase } from '@/lib/supabase'
import type { Photo } from '@/types/database'

export async function fetchPhotos(
  userId: string,
  opts: { month?: string; pinnedOnly?: boolean } = {},
): Promise<Photo[]> {
  let query = supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('date_taken', { ascending: false })
    .order('created_at', { ascending: true })

  if (opts.month) {
    query = query.gte('date_taken', `${opts.month}-01`).lte('date_taken', `${opts.month}-31`)
  }
  if (opts.pinnedOnly) {
    query = query.eq('is_pinned', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function pinPhotoAsDaily(
    userId: string,
    photo: Photo,
    allowPinAfterDay: boolean,
    todayStr: string,
  ) {
    if (!allowPinAfterDay && photo.date_taken !== todayStr) {
      throw new Error('Hanya foto hari ini yang bisa dipilih sebagai Daily')
    }
  
    const { error: unpinError } = await supabase
      .from('photos')
      .update({ is_pinned: false })
      .eq('user_id', userId)
      .eq('date_taken', photo.date_taken)
  
    if (unpinError) throw unpinError
  
    const { data, error } = await supabase
      .from('photos')
      .update({ is_pinned: true })
      .eq('id', photo.id)
      .eq('user_id', userId)
      .select()
      .single()
  
    if (error) throw error
    return data
  }

  function extractStoragePath(publicUrl: string | null): string | null {
    if (!publicUrl) return null
    const marker = '/storage/v1/object/public/photos/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    return publicUrl.slice(idx + marker.length)
  }
  
  export async function deletePhoto(userId: string, photo: Photo) {
    const paths = [extractStoragePath(photo.url), extractStoragePath(photo.thumbnail_url)].filter(
      (p): p is string => p !== null,
    )
  
    if (paths.length > 0) {
      await supabase.storage.from('photos').remove(paths)
    }
  
    // snaps & memories terkait foto ini otomatis kehapus lewat ON DELETE CASCADE di database
    const { error } = await supabase.from('photos').delete().eq('id', photo.id).eq('user_id', userId)
    if (error) throw error
  }