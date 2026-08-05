export type DetectionResult = {
  canonical_key: string
  scientific_name?: string
  common_name_en: string
  common_name_id?: string
  category: string
  native_region?: string
  confidence: number
  condition_note?: string
  context_note?: string
  global_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  // Rarity v2 — khusus category='person'
  acquisition_type?: 'candid_chance' | 'candid_event' | 'merch_general' | 'merch_signed' | 'merch_personalized'
  has_visible_signature?: boolean
  is_sealed_package?: boolean
}

const VALID_RARITIES = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary'])
const VALID_ACQUISITION_TYPES = new Set(['candid_chance', 'candid_event', 'merch_general', 'merch_signed', 'merch_personalized'])

function sanitizeDetection(raw: Record<string, unknown>): DetectionResult | null {
  if (typeof raw.canonical_key !== 'string' || !raw.canonical_key.trim()) return null
  if (typeof raw.common_name_en !== 'string' || !raw.common_name_en.trim()) return null
  if (typeof raw.confidence !== 'number') return null
  if (typeof raw.global_rarity !== 'string' || !VALID_RARITIES.has(raw.global_rarity)) return null

  return {
    canonical_key: raw.canonical_key.trim().toLowerCase().replace(/\s+/g, '_'),
    common_name_en: raw.common_name_en.trim(),
    common_name_id: typeof raw.common_name_id === 'string' ? raw.common_name_id.trim() : undefined,
    scientific_name: typeof raw.scientific_name === 'string' ? raw.scientific_name.trim() : undefined,
    category: typeof raw.category === 'string' ? raw.category : 'other',
    native_region: typeof raw.native_region === 'string' ? raw.native_region.trim() : undefined,
    global_rarity: raw.global_rarity as DetectionResult['global_rarity'],
    confidence: Math.min(1, Math.max(0, raw.confidence)),
    condition_note: typeof raw.condition_note === 'string' ? raw.condition_note.trim() : undefined,
    context_note: typeof raw.context_note === 'string' ? raw.context_note.trim() : undefined,
    acquisition_type: typeof raw.acquisition_type === 'string' && VALID_ACQUISITION_TYPES.has(raw.acquisition_type)
      ? raw.acquisition_type as DetectionResult['acquisition_type']
      : undefined,
    has_visible_signature: typeof raw.has_visible_signature === 'boolean' ? raw.has_visible_signature : false,
    is_sealed_package: typeof raw.is_sealed_package === 'boolean' ? raw.is_sealed_package : false,
  }
}

export function sanitizeDetectionResponse(parsed: Record<string, unknown>) {
  const mainRaw = parsed.main as Record<string, unknown> | undefined
  if (!mainRaw) throw new Error('Invalid AI response structure')

  const main = sanitizeDetection(mainRaw)
  if (!main) throw new Error('Invalid main snap in AI response')

  const secondary = ((parsed.secondary as Record<string, unknown>[]) ?? [])
    .slice(0, 2)
    .map(sanitizeDetection)
    .filter((s): s is DetectionResult => s !== null)

  return { main, secondary }
}