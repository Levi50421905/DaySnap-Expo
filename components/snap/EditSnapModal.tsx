import { useState } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { X, Pencil } from 'lucide-react-native'
import { useAuth } from '@/lib/auth-context'
import { updateSnapDetails } from '@/lib/snaps/queries'

const CATEGORIES = ['food', 'animal', 'plant', 'landmark', 'weather', 'object', 'person', 'other']

interface EditSnapModalProps {
  visible: boolean
  snap: {
    id: string
    common_name_en: string
    common_name_id: string | null
    scientific_name: string | null
    category: string | null
  }
  onClose: () => void
  onSaved: () => void
}

export function EditSnapModal({ visible, snap, onClose, onSaved }: EditSnapModalProps) {
  const { user } = useAuth()
  const [nameEn, setNameEn] = useState(snap.common_name_en)
  const [nameId, setNameId] = useState(snap.common_name_id ?? '')
  const [scientific, setScientific] = useState(snap.scientific_name ?? '')
  const [category, setCategory] = useState(snap.category ?? 'other')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!user || !nameEn.trim()) {
      setError('Nama wajib diisi')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateSnapDetails(snap.id, user.id, {
        common_name_en: nameEn.trim(),
        common_name_id: nameId.trim() || null,
        scientific_name: scientific.trim() || null,
        category,
      })
      onSaved()
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pencil size={14} color="#4ECDC4" />
              <Text style={styles.headerText}>Koreksi Identifikasi</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={16} color="#6B6A66" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }}>
            <Text style={styles.hint}>
              AI kadang salah tebak model/varian spesifik. Koreksi di sini gak akan mengubah rarity yang sudah kamu dapat.
            </Text>

            <Text style={styles.label}>Nama (English) *</Text>
            <TextInput value={nameEn} onChangeText={setNameEn} style={styles.input} placeholderTextColor="#4A4A4E" />

            <Text style={styles.label}>Nama (Indonesia)</Text>
            <TextInput value={nameId} onChangeText={setNameId} style={styles.input} placeholderTextColor="#4A4A4E" />

            <Text style={styles.label}>Nama Ilmiah</Text>
            <TextInput value={scientific} onChangeText={setScientific} style={styles.input} placeholderTextColor="#4A4A4E" />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.categoryChip, { backgroundColor: category === c ? '#4ECDC4' : 'transparent', borderColor: category === c ? '#4ECDC4' : 'rgba(255,255,255,0.15)' }]}
                >
                  <Text style={{ fontSize: 11, color: category === c ? '#0E0E10' : '#6B6A66', textTransform: 'capitalize' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}>
            <Text style={styles.saveText}>{saving ? 'Menyimpan...' : 'Simpan Koreksi'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#1C1C1F', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerText: { color: '#E8E6E1', fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 11, color: '#6B6A66', marginBottom: 16, lineHeight: 16 },
  label: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B6A66', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, color: '#E8E6E1', fontSize: 14 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  error: { color: '#F87171', fontSize: 12, backgroundColor: 'rgba(248,113,113,0.1)', padding: 8, borderRadius: 8, marginTop: 12 },
  saveBtn: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveText: { color: '#0E0E10', fontWeight: '700', fontSize: 13 },
})