import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, SectionList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Anchor } from 'lucide-react-native'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { MemoryCard } from '@/components/memory/MemoryCard'
import { MemoryLightbox } from '@/components/memory/MemoryLightbox'
import { Skeleton } from '@/components/ui/Skeleton'
import { useFocusEffect } from 'expo-router'


type Memory = {
  id: string
  title: string
  reason: string | null
  created_at: string
  photos?: { url: string; thumbnail_url: string | null; date_taken: string; caption: string | null } | null
}

export default function MemoriesScreen() {
  const { user } = useAuth()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Memory | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('memories')
      .select('*, photos(id, url, thumbnail_url, date_taken, caption)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMemories(data ?? [])
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    const year = new Date(m.created_at).getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(m)
    return acc
  }, {})

  const sections = Object.keys(grouped)
    .sort((a, b) => Number(b) - Number(a))
    .map(year => ({ title: year, data: grouped[year] }))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Memories</Text>
          {!loading && <Text style={styles.count}>{memories.length} memory anchor</Text>}
        </View>
        <Anchor size={16} color="#6B6A66" />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Momen yang kamu pilih secara sadar. Tambahkan dari foto manapun dengan menekan{' '}
          <Text style={{ color: '#E8E6E1' }}>Memory Anchor</Text> di lightbox foto.
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 88, borderRadius: 14 }} />)}
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.empty}>
          <Anchor size={28} color="#2E2E32" />
          <Text style={styles.emptyText}>Belum ada memory anchor</Text>
          <Text style={styles.emptySub}>Klik foto → tekan "Memory Anchor"</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderSectionHeader={({ section }) => <Text style={styles.yearLabel}>{section.title}</Text>}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 8 }}>
              <MemoryCard memory={item} onPress={() => setSelected(item)} />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      )}

      {selected && (
        <MemoryLightbox visible={!!selected} memory={selected} onClose={() => setSelected(null)} onDelete={load} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#E8E6E1' },
  count: { fontSize: 11, fontFamily: 'monospace', color: '#6B6A66', marginTop: 2 },
  infoBox: { marginHorizontal: 16, backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 12, marginBottom: 20 },
  infoText: { fontSize: 12, color: '#6B6A66', lineHeight: 18 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyText: { color: '#6B6A66', fontSize: 14 },
  emptySub: { color: '#4A4A4E', fontSize: 12 },
  yearLabel: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B6A66', marginBottom: 10, marginTop: 16 },
})