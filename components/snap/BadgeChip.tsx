import { View, Text, StyleSheet } from 'react-native'
import type { Badge } from '@/types/snap'

const BADGE_CONFIG: Record<Badge, { emoji: string; label: string; color: string }> = {
  chance_encounter: { emoji: '🎯', label: 'Chance Encounter', color: '#4ECDC4' },
  event_exclusive: { emoji: '🎫', label: 'Event Exclusive', color: '#9B6DD6' },
  signed: { emoji: '✍️', label: 'Signed', color: '#E8C547' },
  sealed_mystery: { emoji: '📦', label: 'Sealed Mystery', color: '#4A9EE8' },
  overseas_import: { emoji: '🌏', label: 'Overseas Import', color: '#4CAF6E' },
}

export function BadgeChip({ badge }: { badge: Badge }) {
  const config = BADGE_CONFIG[badge]
  if (!config) return null

  return (
    <View style={[styles.chip, { borderColor: `${config.color}40`, backgroundColor: `${config.color}15` }]}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  )
}

export function BadgeRow({ badges }: { badges: string[] }) {
  if (!badges || badges.length === 0) return null
  return (
    <View style={styles.row}>
      {badges.map(b => <BadgeChip key={b} badge={b as Badge} />)}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  emoji: { fontSize: 10 },
  label: { fontSize: 9, fontFamily: 'monospace', fontWeight: '700' },
})