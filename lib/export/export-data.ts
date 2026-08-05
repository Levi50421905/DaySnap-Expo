import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { supabase } from '@/lib/supabase'

export async function exportUserData(userId: string): Promise<void> {
  const [photosRes, snapsRes, memoriesRes] = await Promise.all([
    supabase.from('photos').select('*').eq('user_id', userId),
    supabase.from('snaps').select('*').eq('user_id', userId),
    supabase.from('memories').select('*').eq('user_id', userId),
  ])

  if (photosRes.error) throw photosRes.error
  if (snapsRes.error) throw snapsRes.error
  if (memoriesRes.error) throw memoriesRes.error

  const exportData = {
    exported_at: new Date().toISOString(),
    photos: photosRes.data ?? [],
    snaps: snapsRes.data ?? [],
    memories: memoriesRes.data ?? [],
  }

  const fileName = `daysnap-export-${Date.now()}.json`
  const file = new File(Paths.document, fileName)

  file.write(JSON.stringify(exportData, null, 2))

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Fitur share tidak tersedia di device ini')
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Simpan atau bagikan data Daysnap kamu',
    UTI: 'public.json',
  })
}