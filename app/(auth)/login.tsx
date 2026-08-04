import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '@/lib/auth-context'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Day<Text style={{ color: '#4ECDC4' }}>snap</Text></Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Masuk...' : 'Login'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/register" style={styles.link}>
        Belum punya akun? Daftar
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E10', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#E8E6E1', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#141416', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
    borderRadius: 12, padding: 14, color: '#E8E6E1', marginBottom: 12, fontSize: 15,
  },
  button: { backgroundColor: '#4ECDC4', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#0E0E10', fontWeight: '700', fontSize: 15 },
  error: { color: '#F87171', fontSize: 13, marginBottom: 8 },
  link: { color: '#4ECDC4', textAlign: 'center', marginTop: 20, fontSize: 13 },
})