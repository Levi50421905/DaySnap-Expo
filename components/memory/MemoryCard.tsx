import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'

interface MemoryCardProps {
  memory: {
    id: string
    title: string
    reason: string | null
    photos?: { url: string; thumbnail_url: string | null; date_taken: string } | null
  }
  onPress: () => void
}

export function MemoryCard({ memory, onPress }: MemoryCardProps) {
  const src = memory.photos?.thumbnail_url ?? memory.photos?.url
  const date = memory.photos?.date_taken
    ? new Date(memory.photos.date_taken + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.thumb}>
        {src && <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" />}
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text numberOfLines={1} style={styles.title}>{memory.title}</Text>
        {memory.reason && <Text numberOfLines={1} style={styles.reason}>"{memory.reason}"</Text>}
        {date && <Text style={styles.date}>{date}</Text>}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, padding: 14, backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, alignItems: 'center' },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#1C1C1F', overflow: 'hidden' },
  title: { fontSize: 14, fontWeight: '600', color: '#E8E6E1' },
  reason: { fontSize: 11, color: '#6B6A66', fontStyle: 'italic', marginTop: 4 },
  date: { fontSize: 9, fontFamily: 'monospace', color: '#4A4A4E', marginTop: 6 },
  arrow: { color: '#2E2E32', fontSize: 18 },
})