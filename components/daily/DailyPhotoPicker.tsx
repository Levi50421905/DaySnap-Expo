import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import type { Photo } from '@/types/database'

interface DailyPhotoPickerProps {
  photos: Photo[]
  pinnedId: string | null
  onSelect: (photoId: string) => void
  loading?: boolean
}

export function DailyPhotoPicker({ photos, pinnedId, onSelect, loading }: DailyPhotoPickerProps) {
  if (photos.length === 0) return null

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.title}>Pilih Foto Daily Hari Ini</Text>
      <Text style={styles.sub}>Tap foto untuk tampil di kalender. Bisa diganti kapan saja sebelum hari berganti.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {photos.map(photo => {
          const isSelected = photo.id === pinnedId
          return (
            <TouchableOpacity
              key={photo.id}
              onPress={() => onSelect(photo.id)}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.thumb, { borderColor: isSelected ? '#4ECDC4' : 'rgba(255,255,255,0.1)', opacity: loading ? 0.5 : 1 }]}
            >
              <Image source={{ uri: photo.thumbnail_url ?? photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {isSelected && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>DAILY</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B6A66', marginBottom: 8 },
  sub: { fontSize: 11, color: '#4A4A4E', marginBottom: 12 },
  thumb: { width: 80, height: 80, borderRadius: 14, overflow: 'hidden', borderWidth: 2, backgroundColor: '#1C1C1F' },
  badge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(78,205,196,0.9)', paddingVertical: 2 },
  badgeText: { textAlign: 'center', fontSize: 9, fontFamily: 'monospace', fontWeight: '700', color: '#0E0E10' },
})