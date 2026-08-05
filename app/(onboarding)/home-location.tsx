import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { HomeLocationForm } from '@/components/location/HomeLocationForm'
import { useAuth } from '@/lib/auth-context'
import { useOnboarding } from '@/lib/onboarding-context'
import { updateUserSettings } from '@/lib/settings/user-settings'
import type { HomeLocation } from '@/lib/location/home'

export default function OnboardingHomeLocationScreen() {
  const { user } = useAuth()
  const { refresh } = useOnboarding()
  const router = useRouter()

  async function handleSave(location: HomeLocation) {
    if (!user) return
    await updateUserSettings(user.id, { home_location: location })
    await refresh()
    router.replace('/(tabs)/daily')
  }

  async function handleSkip() {
    if (!user) return
    // Simpan objek kosong (bukan null) supaya gak ditanya onboarding lagi,
    // tapi Discovery Context otomatis fallback ke 'travel' terus sampai diisi manual dari Settings.
    await updateUserSettings(user.id, { home_location: {} })
    await refresh()
    router.replace('/(tabs)/daily')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Di mana rumahmu?</Text>
        <Text style={styles.subtitle}>
          Daysnap pakai ini untuk menandai apakah temuanmu ditemukan di sekitar rumah, di kota yang sama, atau saat kamu lagi traveling. Bisa diubah lagi kapan saja lewat Settings.
        </Text>

        <View style={{ marginTop: 24 }}>
          <HomeLocationForm onSave={handleSave} saveLabel="Simpan & Lanjut" />
        </View>

        <TouchableOpacity onPress={handleSkip} style={{ marginTop: 20 }}>
          <Text style={styles.skipText}>Lewati dulu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#E8E6E1', marginBottom: 10 },
  subtitle: { fontSize: 13, color: '#6B6A66', lineHeight: 20 },
  skipText: { color: '#6B6A66', fontSize: 13, textAlign: 'center' },
})