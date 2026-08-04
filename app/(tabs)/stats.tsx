import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { fetchStats, type Stats } from '@/lib/stats/queries'
import { RARITY_CONFIG, type RarityTier } from '@/lib/constants/rarity'
import { Skeleton } from '@/components/ui/Skeleton'
import { useFocusEffect } from 'expo-router'

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', animal: '🐾', plant: '🌿', landmark: '🏛️', weather: '🌤', object: '📦', person: '👤', other: '✦',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  )
}

export default function StatsScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      setLoading(true)
      fetchStats(user.id).then(setStats).finally(() => setLoading(false))
    }, [user])
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Stats</Text>
          <View style={styles.grid2}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 90, width: '48%', borderRadius: 14 }} />)}
          </View>
          <Skeleton style={{ height: 100, borderRadius: 14, marginTop: 12 }} />
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (!stats) return null

  const rarestConfig = stats.rarest_rarity ? RARITY_CONFIG[stats.rarest_rarity as RarityTier] : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Stats</Text>

        <View style={styles.grid2}>
          <StatCard label="Hari Aktif" value={stats.active_days} sub="total hari upload foto" />
          <StatCard label="Streak" value={`${stats.current_streak}🔥`} sub={`terpanjang ${stats.longest_streak} hari`} />
          <StatCard label="Total Snaps" value={stats.total_snaps} sub="foto dianalisis" />
          <StatCard label="Memories" value={stats.total_memories} sub="memory anchor" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Discovery Index — Bulan Ini</Text>
          <Text style={styles.discoveryValue}>{stats.discovery_index}</Text>
          <Text style={styles.cardSub}>Berdasarkan rarity dan variasi snap bulan ini</Text>
        </View>

        {stats.snap_of_month && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Snap of the Month</Text>
            <Text style={styles.snapOfMonthName}>{stats.snap_of_month.name}</Text>
            <Text style={styles.cardSub}>{stats.snap_of_month.rarity}</Text>
          </View>
        )}

        {rarestConfig && (
          <View style={[styles.card, { borderColor: `${rarestConfig.color}30`, backgroundColor: `${rarestConfig.color}0D` }]}>
            <Text style={[styles.cardLabel, { color: rarestConfig.color }]}>Rarity Terlangka</Text>
            <Text style={[styles.rarestValue, { color: rarestConfig.color }]}>{rarestConfig.label}</Text>
            <Text style={[styles.cardSub, { color: `${rarestConfig.color}CC` }]}>{stats.rarity_count[stats.rarest_rarity!]} snap</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Koleksi per Rarity</Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as RarityTier[]).map(tier => {
              const count = stats.rarity_count[tier] ?? 0
              const config = RARITY_CONFIG[tier]
              const max = Math.max(...Object.values(stats.rarity_count), 1)
              const pct = (count / max) * 100
              return (
                <View key={tier} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: config.color }]}>{config.label}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: config.color }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {stats.favorite_time && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Waktu Favorit Upload</Text>
            <Text style={styles.favTimeValue}>{stats.favorite_time}</Text>
            {stats.avg_upload_hour !== null && <Text style={styles.cardSub}>Rata-rata jam {stats.avg_upload_hour}:00</Text>}
          </View>
        )}

        {stats.top_category && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Kategori Terbanyak</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <Text style={{ fontSize: 24 }}>{CATEGORY_EMOJI[stats.top_category] ?? '✦'}</Text>
              <Text style={styles.topCategoryText}>{stats.top_category}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800', color: '#E8E6E1', marginBottom: 20 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  statCard: { width: '47%', backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 },
  statLabel: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, color: '#6B6A66', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#E8E6E1' },
  statSub: { fontSize: 11, color: '#4A4A4E', marginTop: 4 },
  card: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardLabel: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, color: '#6B6A66' },
  cardSub: { fontSize: 11, color: '#4A4A4E', marginTop: 4 },
  discoveryValue: { fontSize: 28, fontWeight: '700', color: '#4ECDC4', marginTop: 6 },
  snapOfMonthName: { fontSize: 18, fontWeight: '700', color: '#E8E6E1', marginTop: 6, textTransform: 'capitalize' },
  rarestValue: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', width: 76 },
  barTrack: { flex: 1, height: 6, backgroundColor: '#2E2E32', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barCount: { fontSize: 11, fontFamily: 'monospace', color: '#6B6A66', width: 20, textAlign: 'right' },
  favTimeValue: { fontSize: 18, fontWeight: '700', color: '#E8E6E1', marginTop: 6, textTransform: 'capitalize' },
  topCategoryText: { fontSize: 15, fontWeight: '600', color: '#E8E6E1', textTransform: 'capitalize' },
})