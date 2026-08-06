import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import { compressImage, createThumbnail } from '@/lib/utils/image'

export type PickedPhoto = {
  uri: string
  exif: Record<string, any> | null
  width: number
  height: number
  verified?: boolean // true = diambil langsung dari kamera in-app, gak perlu cek EXIF lagi
}

export function pickedFromCamera(uri: string): PickedPhoto {
  return { uri, exif: null, width: 0, height: 0, verified: true }
}

export async function pickPhotos(multiple: boolean): Promise<PickedPhoto[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) {
    throw new Error('Izin akses galeri dibutuhkan')
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    exif: true,
    quality: 1,
  })

  if (result.canceled) return []

  return result.assets.map(a => ({
    uri: a.uri,
    exif: (a as any).exif ?? null,
    width: a.width,
    height: a.height,
  }))
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri)
  return await response.blob()
}

export async function uploadPhoto(params: {
  userId: string
  picked: PickedPhoto
  dateTaken: string
  caption?: string
  isPinned: boolean
}) {
  const { userId, picked, dateTaken, caption, isPinned } = params

  const compressedUri = await compressImage(picked.uri)
  const thumbUri = await createThumbnail(picked.uri)

  const compressedBlob = await uriToBlob(compressedUri)
  const thumbBlob = await uriToBlob(thumbUri)

  const timestamp = Date.now()
  const filePath = `${userId}/${dateTaken}/${timestamp}.jpg`
  const thumbPath = `${userId}/${dateTaken}/thumb_${timestamp}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, compressedBlob, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath)

  let thumbnailUrl: string | null = null
  const { error: thumbError } = await supabase.storage
    .from('photos')
    .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg' })
  if (!thumbError) {
    thumbnailUrl = supabase.storage.from('photos').getPublicUrl(thumbPath).data.publicUrl
  }

  const { data: photo, error: dbError } = await supabase
    .from('photos')
    .insert({
      user_id: userId,
      url: urlData.publicUrl,
      thumbnail_url: thumbnailUrl,
      date_taken: dateTaken,
      caption: caption ?? null,
      is_pinned: isPinned,
      exif_raw: picked.exif,
    })
    .select()
    .single()

  if (dbError) throw dbError
  return photo
}