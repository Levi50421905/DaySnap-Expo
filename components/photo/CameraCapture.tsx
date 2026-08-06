import { useEffect, useRef, useState } from 'react'
import { Modal, View, TouchableOpacity, StyleSheet, Text } from 'react-native'
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera'
import { X, RotateCcw, Zap, ZapOff } from 'lucide-react-native'
import Slider from '@react-native-community/slider'

interface CameraCaptureProps {
  visible: boolean
  onClose: () => void
  onCapture: (uri: string) => void
}

export function CameraCapture({ visible, onClose, onCapture }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>('back')
  const [flash, setFlash] = useState<FlashMode>('off')
  const [capturing, setCapturing] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const [zoom, setZoom] = useState(0)

  useEffect(() => {
    if (visible) setZoom(0)
  }, [visible])

  async function handleCapture() {
    if (!cameraRef.current || capturing) return
    setCapturing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 })
      if (photo?.uri) onCapture(photo.uri)
    } catch {
      // biarkan user coba lagi
    } finally {
      setCapturing(false)
    }
  }

  if (!visible) return null

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Daysnap butuh akses kamera untuk fitur ini.</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
            <Text style={styles.permissionBtnText}>Izinkan Akses Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
            <Text style={{ color: '#6B6A66' }}>Batal</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} zoom={zoom} />

        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFlash(f => (f === 'off' ? 'on' : 'off'))} style={styles.iconBtn}>
            {flash === 'off' ? <ZapOff size={18} color="#fff" /> : <Zap size={18} color="#E8C547" />}
          </TouchableOpacity>
        </View>

        <View style={styles.zoomRow}>
  <Text style={styles.zoomLabel}>{zoom === 0 ? '1x' : `${(1 + zoom * 4).toFixed(1)}x`}</Text>
  <Slider
    style={{ flex: 1 }}
    minimumValue={0}
    maximumValue={1}
    value={zoom}
    onValueChange={setZoom}
    minimumTrackTintColor="#4ECDC4"
    maximumTrackTintColor="rgba(255,255,255,0.2)"
    thumbTintColor="#4ECDC4"
  />
</View>

        <View style={styles.bottomBar}>
          <View style={{ width: 48 }} />
          <TouchableOpacity onPress={handleCapture} disabled={capturing} style={styles.shutterOuter}>
            <View style={[styles.shutterInner, { opacity: capturing ? 0.5 : 1 }]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))} style={styles.iconBtn}>
            <RotateCcw size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 48 },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  permissionContainer: { flex: 1, backgroundColor: '#0E0E10', alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionText: { color: '#E8E6E1', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  permissionBtnText: { color: '#0E0E10', fontWeight: '700', fontSize: 13 },
  zoomRow: { position: 'absolute', bottom: 140, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 10 },
zoomLabel: { color: '#fff', fontSize: 11, fontFamily: 'monospace', width: 32 },
})