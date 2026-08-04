import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { RarityBadge } from './RarityBadge'
import type { RarityTier } from '@/lib/constants/rarity'

interface SnapCardProps {
  snap: {
    id: string
    common_name_en: string
    common_name_id: string | null
    scientific_name: string | null
    category: string | null
    current_rarity: string
    encounter_count: number
    first_discovered_at: string
    is_unknown?: boolean
    photos?: { url: string; thumbnail_url: string | null } | null
  }
  onPress?: () => void
  width: number
  language?: 'en' | 'id'
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', animal: '🐾', plant: '🌿', landmark: '🏛️',
  weather: '🌤', object: '📦', person: '👤', other: '✦',
}

export function SnapCard({ snap, onPress, width, language = 'en' }: SnapCardProps) {
  const name = snap.is_unknown
    ? 'Unknown Discovery'
    : language === 'id' && snap.common_name_id
      ? snap.common_name_id
      : snap.common_name_en

  const photoUrl = snap.photos?.thumbnail_url ?? snap.photos?.url
  const discoveredDate = new Date(snap.first_discovered_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, { width }]}>
      <View style={[styles.imageWrap, { height: width }]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.emojiWrap}><Text style={{ fontSize: 30 }}>{CATEGORY_EMOJI[snap.category ?? 'other']}</Text></View>
        )}
        {snap.encounter_count > 1 && (
          <View style={styles.encounterBadge}>
            <Text style={styles.encounterText}>×{snap.encounter_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <RarityBadge rarity={snap.current_rarity as RarityTier} size="sm" />
        <Text numberOfLines={1} style={styles.name}>{name}</Text>
        {snap.scientific_name && !snap.is_unknown && (
          <Text numberOfLines={1} style={styles.scientific}>{snap.scientific_name}</Text>
        )}
        <Text style={styles.date}>{discoveredDate}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
  imageWrap: { width: '100%', backgroundColor: '#1C1C1F' },
  emojiWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  encounterBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  encounterText: { color: '#fff', fontSize: 9, fontFamily: 'monospace' },
  info: { padding: 10, gap: 4 },
  name: { color: '#E8E6E1', fontSize: 13, fontWeight: '600' },
  scientific: { color: '#6B6A66', fontSize: 10, fontStyle: 'italic' },
  date: { color: '#4A4A4E', fontSize: 9, fontFamily: 'monospace', marginTop: 2 },
})