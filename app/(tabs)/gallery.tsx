import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, FlatList, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { PhotoLightbox } from '@/components/photo/PhotoLightbox'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchPhotos } from '@/lib/photos/queries'
import type { Photo } from '@/types/database'
import { useFocusEffect } from 'expo-router'

const GAP = 4
const COLUMNS = 3

export default function GalleryScreen() {
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Photo | null>(null)

  const itemSize = (width - GAP * (COLUMNS + 1)) / COLUMNS

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setPhotos(await fetchPhotos(user.id))
    } finally {
      setLoading(false)
    }
  }, [user])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.count}>{loading ? '—' : `${photos.length} foto`}</Text>
      </View>

      {loading ? (
        <View style={styles.grid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} style={{ width: itemSize, height: itemSize, margin: GAP / 2 }} />
          ))}
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>🖼️</Text>
          <Text style={styles.emptyText}>Belum ada foto</Text>
          <Text style={styles.emptySub}>Upload foto dari halaman Daily</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          numColumns={COLUMNS}
          contentContainerStyle={{ padding: GAP / 2 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#6B6A66" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelected(item)}
              style={{ width: itemSize, height: itemSize, margin: GAP / 2, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1C1C1F' }}
            >
              <Image source={{ uri: item.thumbnail_url ?? item.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {item.is_pinned && <View style={styles.pinDot} />}
            </TouchableOpacity>
          )}
        />
      )}

      {selected && (
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#E8E6E1' },
  count: { fontSize: 11, fontFamily: 'monospace', color: '#6B6A66' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: GAP / 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 100 },
  emptyText: { color: '#6B6A66', fontSize: 14 },
  emptySub: { color: '#4A4A4E', fontSize: 12 },
  pinDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 999, backgroundColor: '#4ECDC4' },
})