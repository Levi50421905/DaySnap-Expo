import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Image } from 'expo-image'
import { X, Anchor, Trash2 } from 'lucide-react-native'
import { useAuth } from '@/lib/auth-context'
import { deleteMemory } from '@/lib/memories/queries'

interface MemoryLightboxProps {
  visible: boolean
  memory: {
    id: string
    title: string
    reason: string | null
    created_at: string
    photos?: { url: string; thumbnail_url: string | null; date_taken: string; caption: string | null } | null
  }
  onClose: () => void
  onDelete: () => void
}

export function MemoryLightbox({ visible, memory, onClose, onDelete }: MemoryLightboxProps) {
  const { user } = useAuth()
  const photoUrl = memory.photos?.url ?? memory.photos?.thumbnail_url

  const date = memory.photos?.date_taken
    ? new Date(memory.photos.date_taken + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const savedDate = new Date(memory.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  function confirmDelete() {
    Alert.alert('Hapus memory anchor ini?', undefined, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          if (!user) return
          await deleteMemory(memory.id, user.id)
          onDelete()
          onClose()
        },
      },
    ])
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.photoWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={styles.placeholderWrap}><Anchor size={40} color="#2E2E32" /></View>
            )}
          </View>

          <View style={{ padding: 20 }}>
            <View style={styles.anchorTag}>
              <Anchor size={11} color="#E8C547" />
              <Text style={styles.anchorLabel}>Memory Anchor</Text>
            </View>

            <Text style={styles.title}>{memory.title}</Text>
            {memory.reason && <Text style={styles.reason}>"{memory.reason}"</Text>}
            {memory.photos?.caption && <Text style={styles.caption}>{memory.photos.caption}</Text>}

            <View style={styles.metaBox}>
              {date && <Text style={styles.metaText}>📅 {date}</Text>}
              <Text style={styles.metaText}>⚓ Ditandai {savedDate}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={[styles.iconBtn, { right: 12 }]}>
            <X size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={[styles.iconBtn, { left: 12 }]}>
            <Trash2 size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#141416', borderRadius: 20, overflow: 'hidden' },
  photoWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#1C1C1F' },
  placeholderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  anchorTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  anchorLabel: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: '#E8C547' },
  title: { fontSize: 18, fontWeight: '700', color: '#E8E6E1', marginBottom: 8 },
  reason: { fontSize: 13, color: '#9A9792', fontStyle: 'italic', marginBottom: 10 },
  caption: { fontSize: 13, color: '#6B6A66', marginBottom: 10 },
  metaBox: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10, gap: 4 },
  metaText: { fontSize: 11, fontFamily: 'monospace', color: '#4A4A4E' },
  iconBtn: { position: 'absolute', top: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, padding: 6 },
})