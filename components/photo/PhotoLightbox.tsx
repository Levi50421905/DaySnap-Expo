import { useEffect, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { X, Sparkles, Anchor, Check, Pencil } from 'lucide-react-native'
import { useAuth } from '@/lib/auth-context'
import { getSnapForPhoto } from '@/lib/snaps/queries'
import { getMemoryForPhoto } from '@/lib/memories/queries'
import { MemoryAnchorModal } from '@/components/memory/MemoryAnchorModal'
import { supabase } from '@/lib/supabase'
import type { Photo } from '@/types/database'
import { showDiscoveryAlert } from '@/lib/notifications/discovery-alert'
import { getUserSettings } from '@/lib/settings/user-settings'
import { Trash2 } from 'lucide-react-native'
import { Alert } from 'react-native'
import { deletePhoto } from '@/lib/photos/queries'

interface PhotoLightboxProps {
  visible: boolean
  photo: Photo
  onClose: () => void
  onStatusChange?: () => void
  onDeleted?: () => void
}

export function PhotoLightbox({
  visible,
  photo,
  onClose,
  onStatusChange,
  onDeleted,
}: PhotoLightboxProps) {
  const { user } = useAuth()
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [showMemoryModal, setShowMemoryModal] = useState(false)
  const [snap, setSnap] = useState<{ id: string; common_name_en: string; current_rarity: string } | null>(null)
  const [memory, setMemory] = useState<{ id: string; title: string; reason: string | null } | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const date = new Date(photo.date_taken + 'T00:00:00')
  const formatted = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  async function fetchStatus() {
    if (!user) return
    setLoadingStatus(true)
    const [snapData, memoryData] = await Promise.all([
      getSnapForPhoto(user.id, photo.id),
      getMemoryForPhoto(user.id, photo.id),
    ])
    setSnap(snapData)
    setMemory(memoryData)
    setLoadingStatus(false)
  }

  useEffect(() => {
    if (visible) fetchStatus()
  }, [visible, photo.id])

  async function handleAnalyze() {
    if (!user) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const { data, error } = await supabase.functions.invoke('detect', { body: { photoId: photo.id } })
      if (error) throw error
  
      await fetchStatus()
      onStatusChange?.()
  
      const settings = await getUserSettings(user.id)
      if (data?.detection?.main && settings) {
        await showDiscoveryAlert(data.detection.main.common_name_en, data.detection.main.global_rarity, settings.notif_discovery)
      }
    } catch (e: any) {
      setAnalyzeError(e.message ?? 'Gagal analisis')
    } finally {
      setAnalyzing(false)
    }
  }
  async function confirmDelete() {
    Alert.alert(
      'Hapus foto ini?',
      'Snap dan Memory Anchor yang terkait foto ini juga akan terhapus. Tindakan ini tidak bisa dibatalkan.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            if (!user) return
  
            setDeleting(true)
  
            try {
              await deletePhoto(user.id, photo)
  
              onDeleted?.()
              onClose()
            } catch {
              Alert.alert(
                'Gagal',
                'Gagal menghapus foto. Coba lagi.',
              )
            } finally {
              setDeleting(false)
            }
          },
        },
      ],
    )
  }
  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
        <View style={styles.topBar}>
  <Text style={styles.dateText}>{formatted}</Text>

  <View style={{ flexDirection: 'row', gap: 8 }}>
    <TouchableOpacity
      onPress={confirmDelete}
      disabled={deleting}
      style={styles.closeBtn}
    >
      <Trash2 size={16} color="#F87171" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onClose}
      style={styles.closeBtn}
    >
      <X size={18} color="#fff" />
    </TouchableOpacity>
  </View>
</View>

          <View style={styles.imageWrap}>
            <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} contentFit="contain" />
          </View>

          <View style={styles.bottomPanel}>
            {(photo.caption || snap) && (
              <View style={{ marginBottom: 10 }}>
                {photo.caption && <Text style={styles.caption}>{photo.caption}</Text>}
                {snap && <Text style={styles.snapInfo}>{snap.common_name_en} · {snap.current_rarity}</Text>}
              </View>
            )}

            {!loadingStatus && (
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={handleAnalyze} disabled={analyzing} style={styles.actionBtn}>
                  {analyzing ? <ActivityIndicator size="small" color="#6B6A66" /> : snap ? <Pencil size={11} color="#6B6A66" /> : <Sparkles size={11} color="#6B6A66" />}
                  <Text style={styles.actionText}>{analyzing ? 'Menganalisis...' : snap ? 'Analisis ulang' : 'Analisis foto'}</Text>
                </TouchableOpacity>

                {snap && (
                  <View style={styles.collectionTag}>
                    <Check size={11} color="#4ECDC4" />
                    <Text style={styles.collectionText}>Di Collection</Text>
                  </View>
                )}

                <TouchableOpacity onPress={() => setShowMemoryModal(true)} style={styles.actionBtn}>
                  {memory ? <Pencil size={11} color="#E8C547" /> : <Anchor size={11} color="#6B6A66" />}
                  <Text style={[styles.actionText, memory && { color: '#E8C547' }]}>{memory ? 'Edit Anchor' : 'Memory Anchor'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {analyzeError && <Text style={styles.error}>{analyzeError}</Text>}
          </View>
        </View>
      </Modal>

      <MemoryAnchorModal
        visible={showMemoryModal}
        photoId={photo.id}
        memory={memory}
        onClose={() => setShowMemoryModal(false)}
        onSuccess={() => {
          setShowMemoryModal(false)
          fetchStatus()
          onStatusChange?.()
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48 },
  dateText: { fontSize: 11, fontFamily: 'monospace', color: '#6B6A66' },
  closeBtn: { padding: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  imageWrap: { flex: 1, marginHorizontal: 8 },
  bottomPanel: { backgroundColor: 'rgba(20,20,22,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: 16, paddingBottom: 32 },
  caption: { color: '#E8E6E1', fontSize: 14 },
  snapInfo: { color: '#4ECDC4', fontSize: 12, marginTop: 4 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1C1C1F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { color: '#6B6A66', fontSize: 12 },
  collectionTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  collectionText: { color: '#4ECDC4', fontSize: 12 },
  error: { color: '#F87171', fontSize: 12, marginTop: 8 },
})