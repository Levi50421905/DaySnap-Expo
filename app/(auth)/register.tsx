import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '@/lib/auth-context'

export default function RegisterScreen() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    setError(null)
    const { error } = await signUp(email, password)
    if (error) setError(error)
    else setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>
          Cek email kamu untuk konfirmasi akun, lalu login.
        </Text>
        <Link href="/(auth)/login" style={styles.link}>Ke halaman Login</Link>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buat Akun</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6B6A66"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#6B6A66"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Mendaftar...' : 'Daftar'}</Text>
      </TouchableOpacity>
      <Link href="/(auth)/login" style={styles.link}>Sudah punya akun? Login</Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E10', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#E8E6E1', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#141416', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
    borderRadius: 12, padding: 14, color: '#E8E6E1', marginBottom: 12, fontSize: 15,
  },
  button: { backgroundColor: '#4ECDC4', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#0E0E10', fontWeight: '700', fontSize: 15 },
  error: { color: '#F87171', fontSize: 13, marginBottom: 8 },
  link: { color: '#4ECDC4', textAlign: 'center', marginTop: 20, fontSize: 13 },
  info: { color: '#E8E6E1', textAlign: 'center', fontSize: 14, lineHeight: 20 },
})