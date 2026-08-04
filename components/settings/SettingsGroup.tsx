import { View, Text, StyleSheet } from 'react-native'

export function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.8, color: '#6B6A66', marginBottom: 8, paddingHorizontal: 4 },
  group: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
})