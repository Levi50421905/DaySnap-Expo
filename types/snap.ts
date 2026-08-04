import type { RarityTier } from '@/lib/constants/rarity'

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