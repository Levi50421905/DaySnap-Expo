import { View, Text, StyleSheet } from 'react-native'
import { RarityBadge } from './RarityBadge'
import type { RarityTier } from '@/lib/constants/rarity'

interface Encounter {
  rarity: string
  date: string
  condition?: string | null
}

interface DiscoveryJournalProps {
  encounters: Encounter[]
}

export function DiscoveryJournal({ encounters }: DiscoveryJournalProps) {
  if (encounters.length === 0) return null

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.title}>Discovery Journal</Text>
      <View style={{ gap: 0 }}>
        {encounters.map((enc, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.timelineCol}>
              <View style={[styles.dot, { backgroundColor: i === 0 ? '#4ECDC4' : '#2E2E32' }]} />
              {i < encounters.length - 1 && <View style={styles.line} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 12 }}>
              <View style={styles.metaRow}>
                <Text style={styles.date}>
                  {new Date(enc.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <RarityBadge rarity={enc.rarity as RarityTier} size="sm" />
                {i === 0 && <Text style={styles.firstTag}>first discovery</Text>}
              </View>
              {enc.condition && <Text numberOfLines={1} style={styles.condition}>{enc.condition}</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B6A66', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  timelineCol: { alignItems: 'center', paddingTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  line: { width: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 4, minHeight: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  date: { fontSize: 10, fontFamily: 'monospace', color: '#6B6A66' },
  firstTag: { fontSize: 9, fontFamily: 'monospace', color: '#4ECDC4' },
  condition: { fontSize: 11, color: '#6B6A66', marginTop: 4 },
})