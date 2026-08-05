import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { getCurrentLocation, type HomeLocation } from '@/lib/location/home'

interface HomeLocationFormProps {
  initial?: HomeLocation | null
  onSave: (location: HomeLocation) => Promise<void>
  saveLabel?: string
}

export function HomeLocationForm({ initial, onSave, saveLabel = 'Simpan' }: HomeLocationFormProps) {
  const [city, setCity] = useState(initial?.city ?? '')
  const [country, setCountry] = useState(initial?.country ?? '')
  const [coords, setCoords] = useState<{ lat?: number; lng?: number; region?: string }>({
    lat: initial?.lat, lng: initial?.lng, region: initial?.region,
  })
  const [detecting, setDetecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDetect() {
    setDetecting(true)
    setError(null)
    try {
      const loc = await getCurrentLocation()
      setCity(loc.city ?? '')
      setCountry(loc.country ?? '')
      setCoords({ lat: loc.lat, lng: loc.lng, region: loc.region })
    } catch (e: any) {
      setError(e.message ?? 'Gagal mendeteksi lokasi')
    } finally {
      setDetecting(false)
    }
  }

  async function handleSave() {
    if (!city.trim() && !country.trim()) {
      setError('Isi minimal kota atau negara')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        region: coords.region,
        lat: coords.lat,
        lng: coords.lng,
      })
    } catch (e: any) {
      setError(e.message ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <TouchableOpacity onPress={handleDetect} disabled={detecting} style={styles.detectBtn}>
        {detecting ? <ActivityIndicator size="small" color="#0E0E10" /> : <MapPin size={14} color="#0E0E10" />}
        <Text style={styles.detectText}>{detecting ? 'Mendeteksi...' : 'Gunakan Lokasi Saat Ini'}</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>atau isi manual</Text>

      <View>
        <Text style={styles.label}>Kota</Text>
        <TextInput value={city} onChangeText={setCity} placeholder="Jakarta" placeholderTextColor="#4A4A4E" style={styles.input} />
      </View>

      <View>
        <Text style={styles.label}>Negara</Text>
        <TextInput value={country} onChangeText={setCountry} placeholder="Indonesia" placeholderTextColor="#4A4A4E" style={styles.input} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}>
        {saving ? <ActivityIndicator size="small" color="#0E0E10" /> : <Text style={styles.saveText}>{saveLabel}</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  detectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 12 },
  detectText: { color: '#0E0E10', fontWeight: '700', fontSize: 13 },
  orText: { textAlign: 'center', color: '#4A4A4E', fontSize: 11 },
  label: { fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, color: '#6B6A66', marginBottom: 6 },
  input: { backgroundColor: '#141416', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, color: '#E8E6E1', fontSize: 14 },
  error: { color: '#F87171', fontSize: 12, backgroundColor: 'rgba(248,113,113,0.1)', padding: 10, borderRadius: 10 },
  saveBtn: { backgroundColor: '#E8E6E1', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveText: { color: '#0E0E10', fontWeight: '700', fontSize: 13 },
})