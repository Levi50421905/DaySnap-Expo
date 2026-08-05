import type { RarityTier } from '@/lib/constants/rarity'
export type Badge = 'overseas_import' | 'event_exclusive' | 'signed' | 'chance_encounter' | 'sealed_mystery'

export type AcquisitionType = 'candid_chance' | 'candid_event' | 'merch_general' | 'merch_signed' | 'merch_personalized'
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
  global_rarity: RarityTier
}

export type AIDetectionResponse = {
  main: DetectionResult
  secondary: DetectionResult[]
}