import { View, Text, StyleSheet } from 'react-native'
import { RARITY_CONFIG, type RarityTier } from '@/lib/constants/rarity'

interface RarityBadgeProps {
  rarity: RarityTier
  size?: 'sm' | 'md'
}

export function RarityBadge({ rarity, size = 'md' }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.common
  const isSm = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 2 : 4,
          borderColor: `${config.color}40`,
          backgroundColor: `${config.color}1A`,
        },
      ]}
    >
      <View style={[styles.dot, { width: isSm ? 4 : 5, height: isSm ? 4 : 5, backgroundColor: config.color }]} />
      <Text style={[styles.label, { fontSize: isSm ? 9 : 10, color: config.color }]}>{config.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
  dot: { borderRadius: 999 },
  label: { fontFamily: 'monospace', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
})