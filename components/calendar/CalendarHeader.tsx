import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'

interface CalendarHeaderProps {
  month: Date
  onPrev: () => void
  onNext: () => void
}

export function CalendarHeader({ month, onPrev, onNext }: CalendarHeaderProps) {
  const label = month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear()

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPrev} style={styles.btn}>
        <ChevronLeft size={18} color="#6B6A66" />
      </TouchableOpacity>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onNext} disabled={isCurrentMonth} style={styles.btn}>
        <ChevronRight size={18} color={isCurrentMonth ? '#2E2E32' : '#6B6A66'} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  btn: { padding: 8, borderRadius: 8 },
  label: { fontSize: 17, fontWeight: '700', color: '#E8E6E1', textTransform: 'capitalize' },
})