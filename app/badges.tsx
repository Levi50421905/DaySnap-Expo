import { useCallback, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { TouchableOpacity } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { fetchBadgeCounts, type BadgeCount } from '@/lib/badges/queries'
import { Skeleton } from '@/components/ui/Skeleton'

const ALL_BADGES: { key: string; emoji: string; label: string; desc: string; color: string }[] = [
  { key: 'chance_encounter', emoji: '🎯', label: 'Chance Encounter', desc: 'Ketemu seseorang gak sengaja di jalan', color: '#4ECDC4' },
  { key: 'event_exclusive', emoji: '🎫', label: 'Event Exclusive', desc: 'Ketemu di event/meet & greet', color: '#9B6DD6' },
  { key: 'signed', emoji: '✍️', label: 'Signed', desc: 'Punya barang bertanda tangan', color: '#E8C547' },
  { key: 'sealed_mystery', emoji: '📦', label: 'Sealed Mystery', desc: 'Foto barang yang masih tersegel', color: '#4A9EE8' },
  { key: 'overseas_import', emoji: '🌏', label: 'Overseas Import', desc: 'Temuan dari luar negeri asalmu', color: '#4CAF6E' },
]

export default function BadgesScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState<BadgeCount>({})
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      setLoading(true)
      fetchBadgeCounts(user.id).then(setCounts).finally(() => setLoading(false))
    }, [user])
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={20} color="#E8E6E1" />
        </TouchableOpacity>
        <Text style={styles.title}>My Badges</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={styles.grid}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} style={{ width: '47%', height: 140, borderRadius: 16 }} />)}
          </View>
        ) : (
          <View style={styles.grid}>
            {ALL_BADGES.map(badge => {
              const count = counts[badge.key] ?? 0
              const unlocked = count > 0
              return (
                <View
                  key={badge.key}
                  style={[
                    styles.medalCard,
                    unlocked
                      ? { borderColor: `${badge.color}40`, backgroundColor: `${badge.color}0D` }
                      : { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#141416' },
                  ]}
                >
                  <Text style={[styles.medalEmoji, !unlocked && styles.locked]}>{badge.emoji}</Text>
                  <Text style={[styles.medalLabel, { color: unlocked ? badge.color : '#4A4A4E' }]}>{badge.label}</Text>
                  <Text style={styles.medalDesc}>{badge.desc}</Text>
                  {unlocked && (
                    <View style={[styles.countBadge, { backgroundColor: badge.color }]}>
                      <Text style={styles.countText}>{count}</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#141416', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: '#E8E6E1' },
  container: { padding: 16, paddingTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  medalCard: { width: '47%', borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, position: 'relative' },
  medalEmoji: { fontSize: 36 },
  locked: { opacity: 0.2 },
  medalLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  medalDesc: { fontSize: 10, color: '#4A4A4E', textAlign: 'center', lineHeight: 14 },
  countBadge: { position: 'absolute', top: 10, right: 10, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  countText: { fontSize: 10, fontWeight: '800', color: '#0E0E10' },
})