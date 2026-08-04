import { useState } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { X, Anchor } from 'lucide-react-native'
import { useAuth } from '@/lib/auth-context'
import { createMemory, updateMemory } from '@/lib/memories/queries'

interface MemoryData {
  id: string
  title: string
  reason: string | null
}

interface MemoryAnchorModalProps {
  visible: boolean
  photoId: string
  memory?: MemoryData | null
  onClose: () => void
  onSuccess: () => void
}

export function MemoryAnchorModal({ visible, photoId, memory, onClose, onSuccess }: MemoryAnchorModalProps) {
  const { user } = useAuth()
  const isEdit = !!memory
  const [title, setTitle] = useState(memory?.title ?? '')
  const [reason, setReason] = useState(memory?.reason ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!title.trim() || !user) {
      setError('Judul wajib diisi')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (isEdit) {
        await updateMemory(memory!.id, user.id, title.trim(), reason.trim() || null)
      } else {
        await createMemory(user.id, photoId, title.trim(), reason.trim() || null)
      }
      onSuccess()
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan memory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Anchor size={14} color="#4ECDC4" />
              <Text style={styles.headerText}>{isEdit ? 'Edit Memory Anchor' : 'Memory Anchor'}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={16} color="#6B6A66" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Judul *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Nama momen ini..." placeholderTextColor="#4A4A4E" maxLength={80} style={styles.input} />

          <Text style={styles.label}>Kenapa ini penting? (opsional)</Text>
          <TextInput value={reason} onChangeText={setReason} placeholder="Satu kalimat singkat..." placeholderTextColor="#4A4A4E" maxLength={200} multiline style={[styles.input, { minHeight: 60 }]} />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity onPress={handleSubmit} disabled={loading || !title.trim()} style={[styles.submitBtn, { opacity: loading || !title.trim() ? 0.5 : 1 }]}>
            <Text style={styles.submitText}>{loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Memory'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#1C1C1F', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerText: { color: '#E8E6E1', fontWeight: '700', fontSize: 14 },
  label: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B6A66', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, color: '#E8E6E1', fontSize: 14 },
  error: { color: '#F87171', fontSize: 12, backgroundColor: 'rgba(248,113,113,0.1)', padding: 8, borderRadius: 8, marginTop: 12 },
  submitBtn: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  submitText: { color: '#0E0E10', fontWeight: '700', fontSize: 13 },
})