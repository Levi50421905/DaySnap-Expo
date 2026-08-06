import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native'
import { Upload, X, CheckCircle2 } from 'lucide-react-native'
import { useAuth } from '@/lib/auth-context'
import { pickPhotos, uploadPhoto, type PickedPhoto } from '@/lib/photos/upload'
import { getTodayString } from '@/lib/exif/validator'
import { validatePhotoAuthenticity } from '@/lib/exif/validator'
import { Camera as CameraIcon } from 'lucide-react-native'
import { CameraCapture } from './CameraCapture'
import { pickedFromCamera } from '@/lib/photos/upload'

interface PhotoUploadProps {
  dayChangeHour: number
  onSuccess?: () => void
  multiple?: boolean
}

export function PhotoUpload({ dayChangeHour, onSuccess, multiple = true }: PhotoUploadProps) {
  const { user } = useAuth()
  const [queue, setQueue] = useState<PickedPhoto[]>([])
  const [caption, setCaption] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [showCamera, setShowCamera] = useState(false)

  async function handlePick() {
    setError(null)
    try {
      const picked = await pickPhotos(multiple)
      if (picked.length === 0) return
  
      const valid: PickedPhoto[] = []
      const rejectedReasons: string[] = []
  
      for (const item of picked) {
        const check = validatePhotoAuthenticity(item.exif, dayChangeHour)
        if (check.valid) {
          valid.push(item)
        } else {
          rejectedReasons.push(check.error ?? 'Foto ditolak')
        }
      }
  
      if (valid.length > 0) {
        setQueue(prev => (multiple ? [...prev, ...valid] : valid))
      }
  
      if (rejectedReasons.length > 0) {
        const uniqueReasons = [...new Set(rejectedReasons)]
        setError(`${rejectedReasons.length} foto ditolak: ${uniqueReasons[0]}`)
      }
    } catch (e: any) {
      setError(e.message ?? 'Gagal membuka galeri')
    }
  }

  function handleCameraCapture(uri: string) {
    setShowCamera(false)
    const item = pickedFromCamera(uri)
    setQueue(prev => (multiple ? [...prev, item] : [item]))
  }

  function removeFromQueue(index: number) {
    setQueue(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (!user || queue.length === 0) return

    setLoading(true)
    setError(null)
    setProgress({ done: 0, total: queue.length })

    const todayStr = getTodayString(dayChangeHour)
    let failed = 0

    try {
      for (let i = 0; i < queue.length; i++) {
        try {
          await uploadPhoto({
            userId: user.id,
            picked: queue[i],
            dateTaken: todayStr,
            caption: i === 0 ? caption.trim() : undefined,
            isPinned: false,
          })
        } catch {
          failed++
        }
        setProgress({ done: i + 1, total: queue.length })
      }

      if (failed === queue.length) {
        setError('Semua upload gagal')
        return
      }

      setQueue([])
      setCaption('')
      onSuccess?.()
    } catch {
      setError('Terjadi kesalahan saat upload')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {queue.length === 0 ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowCamera(true)}
            style={[styles.dropzone, { flex: 1 }]}
          >
            <CameraIcon color="#4ECDC4" size={22} />
            <Text style={styles.dropzoneText}>Ambil Foto</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            onPress={handlePick}
            style={[styles.dropzone, { flex: 1 }]}
          >
            <Upload color="#6B6A66" size={22} />
            <Text style={styles.dropzoneText}>Pilih dari Galeri</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {queue.map((item, index) => (
              <View key={item.uri} style={styles.previewWrap}>
                <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} />
  
                <TouchableOpacity
                  onPress={() => removeFromQueue(index)}
                  style={styles.removeBtn}
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
  
          {multiple && (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => setShowCamera(true)}>
                <Text style={styles.addMore}>+ Ambil foto lagi</Text>
              </TouchableOpacity>
  
              <TouchableOpacity onPress={handlePick}>
                <Text style={styles.addMore}>+ Tambah dari galeri</Text>
              </TouchableOpacity>
            </View>
          )}
  
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Caption untuk foto pertama... (opsional)"
            placeholderTextColor="#6B6A66"
            multiline
            style={styles.captionInput}
          />
  
          <Text style={styles.hint}>
            Foto masuk Gallery dulu. Pilih foto Daily setelah upload selesai.
          </Text>
  
          {error && <Text style={styles.error}>{error}</Text>}
  
          {progress && (
            <Text style={styles.progress}>
              Upload {progress.done}/{progress.total}...
            </Text>
          )}
  
          <TouchableOpacity
            onPress={handleUpload}
            disabled={loading}
            style={[
              styles.uploadBtn,
              { opacity: loading ? 0.6 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#0E0E10" />
            ) : (
              <>
                <CheckCircle2 size={14} color="#0E0E10" />
                <Text style={styles.uploadBtnText}>
                  Upload {queue.length} Foto
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
  
      <CameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  dropzone: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
  dropzoneText: { color: '#6B6A66', fontSize: 13 },
  previewWrap: { width: 88, height: 88, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1C1C1F' },
  removeBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, padding: 4 },
  addMore: { color: '#4ECDC4', fontSize: 12 },
  captionInput: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: '#E8E6E1', fontSize: 13, minHeight: 44 },
  hint: { color: '#6B6A66', fontSize: 11 },
  error: { color: '#F87171', fontSize: 13, backgroundColor: 'rgba(248,113,113,0.1)', padding: 10, borderRadius: 10 },
  progress: { color: '#6B6A66', fontSize: 11, fontFamily: 'monospace' },
  uploadBtn: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  uploadBtnText: { color: '#0E0E10', fontWeight: '700', fontSize: 13 },
})