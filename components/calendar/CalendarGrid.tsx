import { View, Text, StyleSheet } from 'react-native'
import { CalendarCell } from './CalendarCell'
import type { Photo } from '@/types/database'

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface CalendarGridProps {
  month: Date
  photos: Photo[]
  onCellPress?: (photo: Photo) => void
}

export function CalendarGrid({ month, photos, onCellPress }: CalendarGridProps) {
  const today = new Date()

  const photoMap = new Map<number, Photo>()
  for (const photo of photos) {
    if (!photo.is_pinned) continue
    const day = new Date(photo.date_taken + 'T00:00:00').getDate()
    photoMap.set(day, photo)
  }

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  const cells: { day: number; inMonth: boolean }[] = [
    ...Array.from({ length: firstDay }, () => ({ day: 0, inMonth: false })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, inMonth: true })),
  ]

  const isCurrentMonth = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()

  return (
    <View>
      <View style={styles.labelRow}>
        {DAY_LABELS.map(label => (
          <Text key={label} style={styles.labelText}>{label}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, idx) => (
          <View key={idx} style={styles.cellWrap}>
            <CalendarCell
              day={cell.day}
              photo={cell.inMonth ? photoMap.get(cell.day) : undefined}
              isToday={isCurrentMonth && cell.inMonth && cell.day === today.getDate()}
              isCurrentMonth={cell.inMonth}
              onPress={() => {
                const photo = photoMap.get(cell.day)
                if (photo) onCellPress?.(photo)
              }}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', marginBottom: 8 },
  labelText: {
    flex: 1, textAlign: 'center', fontSize: 9, fontFamily: 'monospace',
    textTransform: 'uppercase', letterSpacing: 1, color: '#6B6A66', paddingVertical: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: `${100 / 7}%` },
})