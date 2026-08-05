import * as Location from 'expo-location'

export type HomeLocation = {
  country?: string
  region?: string
  city?: string
  lat?: number
  lng?: number
}

export async function getCurrentLocation(): Promise<HomeLocation> {
  const perm = await Location.requestForegroundPermissionsAsync()
  if (!perm.granted) {
    throw new Error('Izin lokasi dibutuhkan. Aktifkan lewat Pengaturan HP kalau sudah pernah ditolak.')
  }

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })

  const [place] = await Location.reverseGeocodeAsync({
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  })

  return {
    country: place?.country ?? undefined,
    region: place?.region ?? undefined,
    city: place?.city ?? place?.subregion ?? undefined,
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  }
}