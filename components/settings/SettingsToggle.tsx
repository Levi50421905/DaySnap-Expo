import { TouchableOpacity, View, StyleSheet } from 'react-native'

interface SettingsToggleProps {
  enabled: boolean
  onChange: (val: boolean) => void
}

export function SettingsToggle({ enabled, onChange }: SettingsToggleProps) {
  return (
    <TouchableOpacity onPress={() => onChange(!enabled)} activeOpacity={0.8}>
      <View style={[styles.track, { backgroundColor: enabled ? '#4ECDC4' : 'rgba(255,255,255,0.1)' }]}>
        <View style={[styles.thumb, { left: enabled ? 18 : 2 }]} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  track: { width: 36, height: 20, borderRadius: 10, justifyContent: 'center' },
  thumb: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
})