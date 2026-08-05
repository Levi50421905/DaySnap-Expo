import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { SettingsGroup } from '@/components/settings/SettingsGroup'
import { SettingsItem } from '@/components/settings/SettingsItem'
import { SettingsToggle } from '@/components/settings/SettingsToggle'
import { getUserSettings, updateUserSettings, type UserSettings } from '@/lib/settings/user-settings'
import { deleteUserData, resetCollection } from '@/lib/account/delete'
import { useFocusEffect } from 'expo-router'
import { Modal } from 'react-native'
import { HomeLocationForm } from '@/components/location/HomeLocationForm'
import { scheduleDailyReminder, scheduleMonthlyRecap } from '@/lib/notifications/schedule'
import DateTimePicker from '@react-native-community/datetimepicker'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{ photos: number; snaps: number } | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showDayChangePicker, setShowDayChangePicker] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const s = await getUserSettings(user.id)
    setSettings(s)
    const [{ count: photoCount }, { count: snapCount }] = await Promise.all([
      supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('snaps').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    setStorageInfo({ photos: photoCount ?? 0, snaps: snapCount ?? 0 })
    setLoading(false)
  }, [user])

  useFocusEffect(   
    useCallback(() => {
      load()
    }, [load])
  )

  async function update(key: keyof UserSettings, value: any) {
    if (!user || !settings) return
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    setSaving(true)
    try {
      await updateUserSettings(user.id, { [key]: value })
  
      if (key === 'reminder_time' || key === 'notif_daily_reminder') {
        await scheduleDailyReminder(updated.reminder_time, updated.notif_daily_reminder)
      }
      if (key === 'notif_monthly_recap') {
        await scheduleMonthlyRecap(updated.notif_monthly_recap)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleResetCollection() {
    Alert.alert('Hapus semua snap di Collection?', 'Foto tetap tersimpan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          if (!user) return
          await resetCollection(user.id)
          Alert.alert('Berhasil', 'Collection direset.')
          load()
        },
      },
    ])
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Hapus akun dan semua data?',
      'Foto, snaps, dan memories akan terhapus permanen. Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive', onPress: async () => {
            if (!user) return
            try {
              await deleteUserData(user.id)
              await signOut()
            } catch {
              Alert.alert('Gagal', 'Gagal menghapus akun. Coba lagi.')
            }
          },
        },
      ],
    )
  }

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingBox}><Text style={{ color: '#6B6A66' }}>Memuat...</Text></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Settings</Text>
          {saving && <Text style={styles.savingText}>Menyimpan...</Text>}
        </View>

        <SettingsGroup label="Account">
          <View style={styles.accountRow}>
            {user?.user_metadata?.avatar_url && (
              <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatar} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>{settings.display_name ?? 'User'}</Text>
              <Text style={styles.accountEmail}>{user?.email}</Text>
            </View>
          </View>
          <SettingsItem
            label="Ganti Nama Tampilan"
            sublabel={settings.display_name ?? 'Belum diatur'}
            onPress={() => {
              Alert.prompt?.('Nama tampilan', undefined, (text) => {
                if (text) update('display_name', text)
              }, 'plain-text', settings.display_name ?? '')
            }}
          />
          <SettingsItem label="Logout" danger onPress={() => signOut()} border={false} />
        </SettingsGroup>

        <SettingsGroup label="Daily">
        <SettingsItem
  label="Reminder Harian"
  sublabel="Jam berapa diingatkan untuk upload"
  value={settings.reminder_time}
  onPress={() => setShowTimePicker(true)}
/>
{showTimePicker && (
  <DateTimePicker
    value={(() => {
      const [h, m] = settings.reminder_time.split(':').map(Number)
      const d = new Date()
      d.setHours(h, m, 0, 0)
      return d
    })()}
    mode="time"
    is24Hour
    onChange={(_, selectedDate) => {
      setShowTimePicker(false)
      if (selectedDate) {
        const h = String(selectedDate.getHours()).padStart(2, '0')
        const m = String(selectedDate.getMinutes()).padStart(2, '0')
        update('reminder_time', `${h}:${m}`)
      }
    }}
  />
)}
          <SettingsItem
  label="Jam Pergantian Hari"
  sublabel="Untuk yang sering begadang"
  value={`${settings.day_change_hour}:00`}
  onPress={() => setShowDayChangePicker(true)}
/>
{showDayChangePicker && (
  <DateTimePicker
    value={(() => {
      const d = new Date()
      d.setHours(settings.day_change_hour, 0, 0, 0)
      return d
    })()}
    mode="time"
    is24Hour
    minuteInterval={60}
    onChange={(_, selectedDate) => {
      setShowDayChangePicker(false)
      if (selectedDate) {
        update('day_change_hour', selectedDate.getHours())
      }
    }}
  />
)}
          <SettingsItem label="Zona Waktu" value={settings.timezone} />
          <SettingsItem label="Pin foto setelah hari berlalu" sublabel="Izinkan pin foto ke hari yang sudah lewat" border={false}>
            <SettingsToggle enabled={settings.allow_pin_after_day} onChange={v => update('allow_pin_after_day', v)} />
          </SettingsItem>
          <SettingsItem
  label="Lokasi Rumah"
  sublabel={settings.home_location?.city ? `${settings.home_location.city}${settings.home_location.country ? ', ' + settings.home_location.country : ''}` : 'Belum diatur'}
  onPress={() => setShowLocationModal(true)}
  border={false}
/>
        </SettingsGroup>

        <SettingsGroup label="AI & Collection">
          <SettingsItem label="Auto AI Detection" sublabel="Analisis foto otomatis setelah upload">
            <SettingsToggle enabled={settings.auto_ai_detection} onChange={v => update('auto_ai_detection', v)} />
          </SettingsItem>
          <SettingsItem label="Tampilkan Secondary Snap" sublabel="Snap pendukung selain main snap">
            <SettingsToggle enabled={settings.show_secondary_snap} onChange={v => update('show_secondary_snap', v)} />
          </SettingsItem>
          <SettingsItem label="Izinkan Unknown Discovery" sublabel="Saat AI tidak yakin dengan identitas objek" border={false}>
            <SettingsToggle enabled={settings.allow_unknown_discovery} onChange={v => update('allow_unknown_discovery', v)} />
          </SettingsItem>
        </SettingsGroup>

        <SettingsGroup label="Appearance">
          <SettingsItem label="Tema" value="Dark" />
          <SettingsItem label="Accent Color" value="Teal" border={false} />
        </SettingsGroup>

        <SettingsGroup label="Language">
          <SettingsItem label="App Language" value={settings.app_language === 'id' ? 'Bahasa Indonesia' : 'English'} />
          <SettingsItem label="Collection Language" value={settings.collection_language === 'en' ? 'English' : 'Bahasa Indonesia'} />
          <SettingsItem label="Tampilkan Nama Ilmiah" sublabel="Felis catus · Rafflesia arnoldii" border={false}>
            <SettingsToggle enabled={settings.show_scientific_names} onChange={v => update('show_scientific_names', v)} />
          </SettingsItem>
        </SettingsGroup>

        <SettingsGroup label="Notifications">
          <SettingsItem label="Daily Reminder">
            <SettingsToggle enabled={settings.notif_daily_reminder} onChange={v => update('notif_daily_reminder', v)} />
          </SettingsItem>
          <SettingsItem label="Discovery Notification">
            <SettingsToggle enabled={settings.notif_discovery} onChange={v => update('notif_discovery', v)} />
          </SettingsItem>
          <SettingsItem label="Monthly Recap" border={false}>
            <SettingsToggle enabled={settings.notif_monthly_recap} onChange={v => update('notif_monthly_recap', v)} />
          </SettingsItem>
        </SettingsGroup>

        <SettingsGroup label="Privacy & Data">
          <SettingsItem label="Reset Collection" sublabel="Hapus semua snap tanpa hapus foto" onPress={handleResetCollection} />
          <SettingsItem label="Hapus Akun & Data" sublabel="Hapus semua foto, snaps, memories, dan akun" danger onPress={handleDeleteAccount} border={false} />
        </SettingsGroup>

        <SettingsGroup label="Storage">
          <SettingsItem label="Foto" value={storageInfo ? `${storageInfo.photos} foto` : '—'} />
          <SettingsItem label="Collection" value={storageInfo ? `${storageInfo.snaps} discoveries` : '—'} border={false} />
        </SettingsGroup>

        <SettingsGroup label="About">
          <SettingsItem label="Versi" value="1.0.0" border={false} />
        </SettingsGroup>
      </ScrollView>
      <Modal visible={showLocationModal} animationType="slide" transparent onRequestClose={() => setShowLocationModal(false)}>
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
    <View style={{ backgroundColor: '#141416', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
      <Text style={{ color: '#E8E6E1', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>Lokasi Rumah</Text>
      <HomeLocationForm
        initial={settings.home_location}
        onSave={async (loc) => {
          await update('home_location', loc)
          setShowLocationModal(false)
        }}
      />
    </View>
  </View>
</Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#E8E6E1' },
  savingText: { fontSize: 11, fontFamily: 'monospace', color: '#6B6A66' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  accountName: { fontSize: 14, color: '#E8E6E1' },
  accountEmail: { fontSize: 11, color: '#6B6A66', marginTop: 2 },
})