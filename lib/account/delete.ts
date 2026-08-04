import { supabase } from '@/lib/supabase'

async function deleteUserStorage(userId: string) {
  const paths: string[] = []
  const { data: dateFolders } = await supabase.storage.from('photos').list(userId)
  for (const folder of dateFolders ?? []) {
    const folderPath = `${userId}/${folder.name}`
    const { data: files } = await supabase.storage.from('photos').list(folderPath)
    for (const file of files ?? []) paths.push(`${folderPath}/${file.name}`)
  }
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100)
    if (batch.length > 0) await supabase.storage.from('photos').remove(batch)
  }
}

export async function deleteUserData(userId: string) {
  await deleteUserStorage(userId)
  await supabase.from('memories').delete().eq('user_id', userId)
  await supabase.from('snaps').delete().eq('user_id', userId)
  await supabase.from('photos').delete().eq('user_id', userId)
  await supabase.from('user_settings').delete().eq('user_id', userId)
  // Hapus akun auth-nya sendiri butuh service role — dilakukan lewat Edge Function
  const { error } = await supabase.functions.invoke('delete-account')
  if (error) throw error
}

export async function resetCollection(userId: string) {
  const { error } = await supabase.from('snaps').delete().eq('user_id', userId)
  if (error) throw error
}