import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface SettingsItemProps {
  label: string
  sublabel?: string
  value?: string
  danger?: boolean
  onPress?: () => void
  children?: React.ReactNode
  border?: boolean
}

export function SettingsItem({ label, sublabel, value, danger, onPress, children, border = true }: SettingsItemProps) {
  const Wrapper = onPress ? TouchableOpacity : View

  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={[styles.row, border && styles.border]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
      <View style={styles.right}>
        {value && <Text style={styles.value}>{value}</Text>}
        {children}
        {onPress && !children && <Text style={styles.chevron}>›</Text>}
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  label: { fontSize: 14, color: '#E8E6E1' },
  danger: { color: '#F87171' },
  sublabel: { fontSize: 11, color: '#6B6A66', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 16 },
  value: { fontSize: 11, fontFamily: 'monospace', color: '#6B6A66' },
  chevron: { color: '#4A4A4E', fontSize: 16 },
})