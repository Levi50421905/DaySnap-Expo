export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export const RARITY_ORDER: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export function degradeRarity(current: RarityTier): RarityTier {
  const idx = RARITY_ORDER.indexOf(current)
  return idx > 0 ? RARITY_ORDER[idx - 1] : 'common'
}

export function boostRarity(current: RarityTier, steps = 1): RarityTier {
  const idx = RARITY_ORDER.indexOf(current)
  return RARITY_ORDER[Math.min(idx + steps, RARITY_ORDER.length - 1)]
}

export type AccessibilityLevel = 'very_high' | 'high' | 'standard' | 'very_low' | 'unknown'

const NEIGHBOR_REGIONS: Record<string, string[]> = {
  indonesia: ['malaysia', 'singapore', 'brunei', 'timor-leste'],
  france: ['belgium', 'switzerland', 'luxembourg', 'monaco'],
  italy: ['france', 'switzerland', 'austria', 'slovenia'],
  japan: ['south korea', 'china', 'taiwan'],
}

export function getAccessibilityLevel(nativeRegion: string | null, photoCountry: string | null): AccessibilityLevel {
  if (!nativeRegion || !photoCountry) return 'unknown'
  const native = nativeRegion.toLowerCase()
  const photo = photoCountry.toLowerCase()

  if (native === 'global') return 'standard'
  if (photo.includes(native) || native.includes(photo)) return 'very_high'

  const neighbors = NEIGHBOR_REGIONS[native] ?? []
  if (neighbors.some(n => photo.includes(n))) return 'high'

  return 'very_low'
}

export function calculateDiscoveryContext(
  photoLocation: { country?: string; city?: string } | null,
  homeLocation: { country?: string; city?: string } | null,
  aiContextNote: string | null,
): 'local' | 'travel' | 'home' | null {
  const indoorKeywords = ['indoor', 'dalam rumah', 'di rumah', 'inside home', 'home interior']
  if (aiContextNote && indoorKeywords.some(k => aiContextNote.toLowerCase().includes(k))) {
    return 'home'
  }
  if (!photoLocation || !homeLocation) return null

  const sameCity = homeLocation.city && photoLocation.city &&
    homeLocation.city.toLowerCase() === photoLocation.city.toLowerCase()
  const sameCountry = homeLocation.country && photoLocation.country &&
    homeLocation.country.toLowerCase() === photoLocation.country.toLowerCase()

  if (sameCity) return 'local'
  if (sameCountry) return 'local'
  return 'travel'
}

// ============================================================
// RARITY V2 — Acquisition Modifier (khusus category='person')
// ============================================================
export type AcquisitionType =
  | 'candid_chance'
  | 'candid_event'
  | 'merch_general'
  | 'merch_signed'
  | 'merch_personalized'

const ACQUISITION_BOOST: Record<AcquisitionType, number> = {
  candid_chance: 2,      // paling gak terduga
  candid_event: 1,       // direncanakan tapi tetap butuh effort/rezeki
  merch_general: 0,      // sama kayak orang lain yang beli
  merch_signed: 1,       // ada faktor keberuntungan distribusi
  merch_personalized: 2, // gak bisa ketuker ke orang lain
}

export function getAcquisitionBoost(type?: string | null): number {
  if (!type || !(type in ACQUISITION_BOOST)) return 0
  return ACQUISITION_BOOST[type as AcquisitionType]
}

// ============================================================
// BADGE SYSTEM — layer terpisah, gak pengaruhi tier rarity
// ============================================================
export type Badge = 'overseas_import' | 'event_exclusive' | 'signed' | 'chance_encounter' | 'sealed_mystery'

export function computeBadges(params: {
  acquisitionType?: string | null
  hasVisibleSignature?: boolean
  isSealedPackage?: boolean
  nativeRegion?: string | null
  photoCountry?: string | null
  homeCountry?: string | null
}): Badge[] {
  const badges: Badge[] = []

  if (params.acquisitionType === 'candid_chance') badges.push('chance_encounter')
  if (params.acquisitionType === 'candid_event') badges.push('event_exclusive')
  if (params.hasVisibleSignature) badges.push('signed')
  if (params.isSealedPackage) badges.push('sealed_mystery')

  const home = params.homeCountry?.toLowerCase()
  const origin = (params.nativeRegion ?? params.photoCountry)?.toLowerCase()
  if (home && origin && origin !== 'global' && home !== origin) {
    badges.push('overseas_import')
  }

  return badges
}

// ============================================================
// FINAL RARITY CALCULATION
// ============================================================
interface RarityInput {
  global_rarity: RarityTier
  encounter_count: number
  confidence: number
}

export function calculateFinalRarity(
  input: RarityInput,
  accessibility: AccessibilityLevel,
  acquisitionType?: string | null,
): RarityTier {
  let rarity = input.global_rarity

  // Boost dari accessibility (objek alam/makanan/dll — sudah ada sebelumnya)
  if (accessibility === 'very_low') rarity = boostRarity(rarity, 2)
  else if (accessibility === 'high') rarity = boostRarity(rarity, 1)

  // Boost dari acquisition (khusus person — BARU)
  const acqBoost = getAcquisitionBoost(acquisitionType)
  if (acqBoost > 0) rarity = boostRarity(rarity, acqBoost)

  // Degradasi karena sering ketemu objek yang sama
  const encounterPenalty = Math.min(Math.floor(input.encounter_count / 2), 2)
  for (let i = 0; i < encounterPenalty; i++) rarity = degradeRarity(rarity)

  let idx = RARITY_ORDER.indexOf(rarity)

  // Penalti confidence AI rendah
  if (input.confidence < 0.4) idx = Math.max(idx - 2, 0)
  else if (input.confidence < 0.6) idx = Math.max(idx - 1, 0)

  // Floor: objek epic/legendary tetap minimal uncommon buat user
  const globalIdx = RARITY_ORDER.indexOf(input.global_rarity)
  const minIdx = globalIdx >= 3 ? 1 : 0
  idx = Math.max(idx, minIdx)

  return RARITY_ORDER[idx]
}