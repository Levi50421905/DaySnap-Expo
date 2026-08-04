import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import type { Photo } from '@/types/database'

interface CalendarCellProps {
  day: number
  photo?: Photo
  isToday: boolean
  isCurrentMonth: boolean
  onPress?: () => void
}

export function CalendarCell({ day, photo, isToday, isCurrentMonth, onPress }: CalendarCellProps) {
  if (!isCurrentMonth) return <View style={styles.cell} />

  const src = photo?.thumbnail_url ?? photo?.url

  return (
    <View style={styles.cell}>
      <TouchableOpacity
        disabled={!photo}
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.circle,
          {
            borderColor: photo ? (isToday ? '#4ECDC4' : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.1)',
            borderStyle: photo ? 'solid' : 'dashed',
          },
        ]}
      >
        {src && <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" />}
        {photo && <View style={styles.overlay} />}
        <Text style={[styles.dayText, { color: photo ? '#fff' : 'rgba(255,255,255,0.25)' }]}>{day}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  circle: {
    width: '100%', height: '100%', borderRadius: 999, borderWidth: 2,
    overflow: 'hidden', backgroundColor: '#141416', alignItems: 'center', justifyContent: 'flex-end',
  },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  dayText: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
})