import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { X } from 'lucide-react-native'
import { RarityBadge } from './RarityBadge'
import { DiscoveryJournal } from './DiscoveryJournal'
import type { RarityTier } from '@/lib/constants/rarity'

interface SnapDetailProps {
  visible: boolean
  snap: {
    id: string
    common_name_en: string
    common_name_id: string | null
    scientific_name: string | null
    current_rarity: string
    global_rarity: string
    accessibility: string | null
    discovery_context: string | null
    encounter_count: number
    first_discovered_at: string
    condition_note: string | null
    context_note: string | null
    photo_location: Record<string, string> | null
    is_unknown?: boolean
    photos?: { url: string; thumbnail_url: string | null } | null
  }
  onClose: () => void
}

export function SnapDetail({ visible, snap, onClose }: SnapDetailProps) {
  const photoUrl = snap.photos?.url ?? snap.photos?.thumbnail_url
  const locationStr = snap.photo_location
    ? [snap.photo_location.city, snap.photo_location.country].filter(Boolean).join(', ')
    : null

  const encounters = Array.from({ length: snap.encounter_count }, (_, i) => ({
    rarity: i === 0 ? snap.global_rarity : snap.current_rarity,
    date: snap.first_discovered_at,
    condition: i === 0 ? snap.condition_note : null,
  }))

  const rows: [string, string][] = [
    ['Rarity Objek', snap.global_rarity],
    ['Aksesibilitas', snap.accessibility?.replace(/_/g, ' ') ?? '—'],
    ['Konteks', snap.discovery_context ?? '—'],
    ['Location', locationStr ?? '—'],
    ['Encounters', `${snap.encounter_count}×`],
  ]

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {photoUrl && (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={16} color="#fff" />
          </TouchableOpacity>

          <ScrollView style={{ padding: 16 }}>
            <View style={{ marginBottom: 16 }}>
              <View style={styles.badgeRow}>
                <RarityBadge rarity={snap.current_rarity as RarityTier} />
                <Text style={styles.badgeLabel}>Rarity Kamu</Text>
              </View>
              <Text style={styles.title}>{snap.is_unknown ? 'Unknown Discovery' : snap.common_name_en}</Text>
              {snap.common_name_id && !snap.is_unknown && <Text style={styles.subtitle}>{snap.common_name_id}</Text>}
              {snap.scientific_name && !snap.is_unknown && <Text style={styles.scientific}>{snap.scientific_name}</Text>}
            </View>

            <View style={styles.table}>
              {rows.map(([label, value]) => (
                <View key={label} style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{label}</Text>
                  <Text style={styles.tableValue}>{value}</Text>
                </View>
              ))}
            </View>

            {(snap.condition_note || snap.context_note) && (
              <View style={styles.notesBox}>
                {snap.condition_note && <Text style={styles.conditionNote}>{snap.condition_note}</Text>}
                {snap.context_note && <Text style={styles.contextNote}>{snap.context_note}</Text>}
              </View>
            )}

            <DiscoveryJournal encounters={encounters} />
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#141416', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', overflow: 'hidden' },
  photoWrap: { height: 192, width: '100%', backgroundColor: '#1C1C1F' },
  closeBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, padding: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badgeLabel: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, color: '#6B6A66' },
  title: { fontSize: 20, fontWeight: '700', color: '#E8E6E1', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#6B6A66' },
  scientific: { fontSize: 11, color: '#6B6A66', fontStyle: 'italic', marginTop: 2 },
  table: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tableLabel: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, color: '#6B6A66' },
  tableValue: { fontSize: 13, color: '#E8E6E1', textTransform: 'capitalize' },
  notesBox: { backgroundColor: '#1C1C1F', borderRadius: 10, padding: 12, marginBottom: 16, gap: 4 },
  conditionNote: { fontSize: 12, color: '#9A9792' },
  contextNote: { fontSize: 12, color: '#6B6A66', fontStyle: 'italic' },
})