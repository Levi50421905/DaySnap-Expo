import { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { groupSnapsByPhoto } from '@/lib/snaps/collection'
import { SnapCard } from '@/components/snap/SnapCard'
import { SnapDetail } from '@/components/snap/SnapDetail'
import { Skeleton } from '@/components/ui/Skeleton'
import { RARITY_CONFIG, type RarityTier } from '@/lib/constants/rarity'
import { useFocusEffect } from 'expo-router'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'epic', label: 'Epic' },
  { value: 'rare', label: 'Rare' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'common', label: 'Common' },
]

const GAP = 12
const COLUMNS = 2

export default function CollectionScreen() {
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  const [snaps, setSnaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<any | null>(null)

  const itemWidth = (width - 32 - GAP) / COLUMNS

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('snaps')
      .select('*, photos(id, url, thumbnail_url, date_taken, caption)')
      .eq('user_id', user.id)
      .eq('is_main', true)
      .order('first_discovered_at', { ascending: false })

    if (filter !== 'all') query = query.eq('current_rarity', filter)

    const { data } = await query
    setSnaps(groupSnapsByPhoto(data ?? []))
    setLoading(false)
  }, [user, filter])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Collection</Text>
        <Text style={styles.count}>{loading ? '—' : `${snaps.length} discovered`}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {FILTERS.map(f => {
          const config = f.value !== 'all' ? RARITY_CONFIG[f.value as RarityTier] : null
          const active = filter === f.value
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                styles.filterChip,
                { borderColor: active ? (config?.color ?? '#4ECDC4') : 'rgba(255,255,255,0.1)', backgroundColor: active ? (config?.color ?? '#4ECDC4') : 'transparent' },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? '#0E0E10' : '#6B6A66' }]}>{f.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={{ width: itemWidth, height: itemWidth * 1.4, margin: GAP / 2 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={snaps}
          keyExtractor={item => item.id}
          numColumns={COLUMNS}
          contentContainerStyle={{ padding: 16 - GAP / 2 }}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          renderItem={({ item }) => (
            <SnapCard snap={item} width={itemWidth} onPress={() => setSelected(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>✦</Text>
              <Text style={styles.emptyText}>Belum ada temuan</Text>
              <Text style={styles.emptySub}>Analisis foto di Daily/Gallery untuk mulai koleksi</Text>
            </View>
          }
        />
      )}

{selected && (
  <SnapDetail
    visible={!!selected}
    snap={selected}
    onClose={() => setSelected(null)}
    onUpdated={() => {
      setSelected(null)
      load()
    }}
  />
)}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#E8E6E1' },
  count: { fontSize: 11, fontFamily: 'monospace', color: '#6B6A66' },
  filterScroll: { flexGrow: 0, marginBottom: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  filterText: { fontSize: 11, fontFamily: 'monospace', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 - GAP / 2 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyText: { color: '#6B6A66', fontSize: 14 },
  emptySub: { color: '#4A4A4E', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
})