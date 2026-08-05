import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { PhotoUpload } from '@/components/photo/PhotoUpload'
import { PhotoLightbox } from '@/components/photo/PhotoLightbox'
import { DailyPhotoPicker } from '@/components/daily/DailyPhotoPicker'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchPhotos, pinPhotoAsDaily } from '@/lib/photos/queries'
import { getUserSettings, type UserSettings } from '@/lib/settings/user-settings'
import { getTodayString } from '@/lib/exif/validator'
import type { Photo } from '@/types/database'
import { useFocusEffect } from 'expo-router'

export default function DailyScreen() {
  const { user } = useAuth()
  const [month, setMonth] = useState(new Date())
  const [photos, setPhotos] = useState<Photo[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [pinning, setPinning] = useState(false)

  const dayChangeHour = settings?.day_change_hour ?? 0
  const todayStr = getTodayString(dayChangeHour)

  const loadSettings = useCallback(async () => {
    if (!user) return
    setSettings(await getUserSettings(user.id))
  }, [user])

  const loadPhotos = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const y = month.getFullYear()
    const m = String(month.getMonth() + 1).padStart(2, '0')
    try {
      setPhotos(await fetchPhotos(user.id, { month: `${y}-${m}` }))
    } finally {
      setLoading(false)
    }
  }, [user, month])

  useEffect(() => { loadSettings() }, [loadSettings])
  useEffect(() => { loadPhotos() }, [loadPhotos])

  useFocusEffect(
    useCallback(() => {
      loadPhotos()
    }, [loadPhotos])
  )

  const todayPhotos = useMemo(() => photos.filter(p => p.date_taken === todayStr), [photos, todayStr])
  const pinnedToday = useMemo(() => todayPhotos.find(p => p.is_pinned) ?? null, [todayPhotos])

  async function handlePinDaily(photoId: string) {
    if (!user || !settings) return
    const photo = todayPhotos.find(p => p.id === photoId)
    if (!photo) return

    setPinning(true)
    try {
      await pinPhotoAsDaily(user.id, photo, settings.allow_pin_after_day, todayStr)
      await loadPhotos()
    } finally {
      setPinning(false)
    }
  }

  function prevMonth() { setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)) }
  function nextMonth() { setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)) }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPhotos} tintColor="#6B6A66" />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Daily</Text>
          <TouchableOpacity
            onPress={() => setShowUpload(!showUpload)}
            style={[styles.uploadToggle, { backgroundColor: showUpload ? 'rgba(255,255,255,0.08)' : '#4ECDC4' }]}
          >
            {showUpload ? <X size={13} color="#E8E6E1" /> : <Plus size={13} color="#0E0E10" />}
            <Text style={[styles.uploadToggleText, { color: showUpload ? '#E8E6E1' : '#0E0E10' }]}>
              {showUpload ? 'Batal' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        {showUpload && (
          <View style={styles.uploadCard}>
            <Text style={styles.uploadCardTitle}>Foto Hari Ini</Text>
            <PhotoUpload dayChangeHour={dayChangeHour} multiple onSuccess={() => { setShowUpload(false); loadPhotos() }} />
          </View>
        )}

        {!loading && todayPhotos.length > 0 && (
          <DailyPhotoPicker photos={todayPhotos} pinnedId={pinnedToday?.id ?? null} onSelect={handlePinDaily} loading={pinning} />
        )}

        <View style={styles.calendarCard}>
          <CalendarHeader month={month} onPrev={prevMonth} onNext={nextMonth} />
          {loading ? <Skeleton style={{ height: 260, borderRadius: 12 }} /> : (
            <CalendarGrid month={month} photos={photos} onCellPress={setSelectedPhoto} />
          )}
        </View>
      </ScrollView>

      {selectedPhoto && (
        <PhotoLightbox
        visible={!!selected}
        photo={selected}
        onClose={() => setSelected(null)}
        onStatusChange={load}
        onDeleted={load}
      />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  container: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#E8E6E1' },
  uploadToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  uploadToggleText: { fontWeight: '700', fontSize: 13 },
  uploadCard: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 20 },
  uploadCardTitle: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B6A66', marginBottom: 12 },
  calendarCard: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 },
})