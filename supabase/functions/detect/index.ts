import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sanitizeDetectionResponse, type DetectionResult } from '../_shared/validate.ts'
import { getAccessibilityLevel, calculateDiscoveryContext, calculateFinalRarity, computeBadges } from '../_shared/rarity.ts'

const MODEL_VERSION = 'gemini-3.5-flash'
const FALLBACK_MODEL = 'gemini-2.5-flash'
const PROMPT_VERSION = '2.3'
const CONFIDENCE_UNKNOWN_THRESHOLD = 0.5

const DETECTION_PROMPT = `
Analyze this photo and identify what is in it. Return ONLY a valid JSON object with no markdown, no backticks, no explanation.

Rules:
- Identify the most interesting/unique object as main snap
- Identify up to 2 supporting elements as secondary snaps
- Be specific: not just "food" but "Soto Banjar" or "Rendang Padang"
- canonical_key must be snake_case, stable, and unique per specific object (not generic)
- native_region: country/region where this object originates; use "global" if not region-specific
- context_note: mention explicitly if the photo appears to be taken indoors/at home
- If the object is a specific product/model (e.g. gadget, smartwatch, phone, vehicle) and you cannot clearly confirm the EXACT model/generation number from visible details (visible text, logos, distinctive design changes), do NOT guess the specific model confidently. In that case: use a more general name (e.g. "Huawei Watch GT Series" instead of guessing "GT 4" or "GT 5"), and set confidence below 0.6 to reflect the uncertainty.

Global rarity rubric (assign global_rarity based on how rare this SPECIFIC object/person is worldwide):
- common: seen daily by most people
- uncommon: common in one region but not everywhere
- rare: specific variant, specialty item, or uncommon species/public figure
- epic: very hard to encounter even with effort
- legendary: extremely unique (<0.01% encounter rate)

SPECIAL RULES FOR category="person" (celebrities, idols, public figures, or their merchandise):
Determine "acquisition_type" based on visual cues:
- "candid_chance": a candid photo of the person taken in a public/street setting, NOT at an organized event (no stage, banner, crowd barrier visible)
- "candid_event": a candid photo taken at an organized event (concert, meet & greet, fan signing — visible stage/banner/crowd control)
- "merch_general": this is a photo of official merchandise (photocard, album, poster) with NO visible signature
- "merch_signed": official merchandise WITH a visible handwritten signature/autograph, but generic (not addressed to a specific name)
- "merch_personalized": official merchandise with a signature that includes a specific person's name written by hand (personalized dedication)
Also determine:
- "has_visible_signature": true if any handwritten signature/autograph is visible anywhere in the photo
- "is_sealed_package": true if the merchandise is still in its original sealed plastic wrap
If category is NOT "person", omit acquisition_type, has_visible_signature, and is_sealed_package entirely (or set them to null/false).

- confidence: 0.0–1.0 how sure you are about the specific identification (not rarity)

Return this exact JSON structure:
{
  "main": {
    "canonical_key": "snake_case_unique_identifier",
    "common_name_en": "English name",
    "common_name_id": "Indonesian name",
    "scientific_name": "Scientific name if applicable or null",
    "category": "food|animal|plant|landmark|weather|object|person|other",
    "native_region": "country or region where this originates",
    "global_rarity": "common|uncommon|rare|epic|legendary",
    "confidence": 0.0,
    "condition_note": "brief note about condition or action in photo",
    "context_note": "brief note about environment or atmosphere",
    "acquisition_type": "candid_chance|candid_event|merch_general|merch_signed|merch_personalized or null",
    "has_visible_signature": false,
    "is_sealed_package": false
  },
  "secondary": []
}
`
function encodeBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunkSize = 0x8000 // 32KB
  
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
  
    return btoa(binary)
  }

  async function callGeminiOnce(imageBuffer: ArrayBuffer, mimeType: string, base64: string) {
    const apiKey = Deno.env.get('GEMINI_API_KEY')!
  
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: DETECTION_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          }],
        }),
      },
    )
  
    if (!res.ok) {
      const errText = await res.text()
      const err = new Error(`Gemini API error: ${res.status} — ${errText}`)
      ;(err as any).status = res.status
      throw err
    }
  
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty AI response')
  
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  }
  
  async function callGemini(imageBuffer: ArrayBuffer, mimeType: string) {
    const base64 = encodeBase64(imageBuffer)
  
    const maxRetries = 3
    let lastError: unknown
  
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await callGeminiOnce(imageBuffer, mimeType, base64)
      } catch (err: any) {
        lastError = err
        const retryable = err.status === 503 || err.status === 429
  
        if (!retryable || attempt === maxRetries - 1) {
          throw err
        }
  
        const delayMs = 1000 * Math.pow(2, attempt) // 1s, 2s, 4s
        console.log(`[detect] Gemini ${err.status}, retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  
    throw lastError
  }

  async function resolveAndSaveSnap(
    supabase: any,
    userId: string,
    photoId: string,
    detection: DetectionResult & { model_version: string; prompt_version: string; is_unknown: boolean },
    isMain: boolean,
    photoLocation: Record<string, string> | null,
    homeLocation: Record<string, string> | null,
  ) {
    const photoCountry = photoLocation?.country ?? null
  
    const { data: priorCanonical } = await supabase
      .from('snaps')
      .select('encounter_count')
      .eq('user_id', userId)
      .eq('canonical_key', detection.canonical_key)
      .eq('is_main', true)
      .order('encounter_count', { ascending: false })
      .limit(1)
      .maybeSingle()
  
    const encounterCount = priorCanonical?.encounter_count ?? 0
  
    const accessibility = getAccessibilityLevel(detection.native_region ?? null, photoCountry)
    const discoveryContext = calculateDiscoveryContext(photoLocation, homeLocation, detection.context_note ?? null)
  
    const finalRarity = calculateFinalRarity(
      { global_rarity: detection.global_rarity, encounter_count: encounterCount, confidence: detection.confidence },
      accessibility,
      detection.acquisition_type ?? null,
    )
  
    const badges = computeBadges({
      acquisitionType: detection.acquisition_type ?? null,
      hasVisibleSignature: detection.has_visible_signature ?? false,
      isSealedPackage: detection.is_sealed_package ?? false,
      nativeRegion: detection.native_region ?? null,
      photoCountry,
      homeCountry: homeLocation?.country ?? null,
    })
  
    const { data: newSnap, error } = await supabase
      .from('snaps')
      .insert({
        user_id: userId,
        photo_id: photoId,
        canonical_key: detection.canonical_key,
        scientific_name: detection.scientific_name ?? null,
        common_name_en: detection.common_name_en,
        common_name_id: detection.common_name_id ?? null,
        category: detection.category,
        global_rarity: detection.global_rarity,
        current_rarity: finalRarity,
        native_region: detection.native_region ?? null,
        accessibility,
        discovery_context: discoveryContext,
        condition_note: detection.condition_note ?? null,
        context_note: detection.context_note ?? null,
        confidence: detection.confidence,
        photo_location: photoLocation,
        is_main: isMain,
        is_unknown: detection.is_unknown,
        model_version: detection.model_version,
        prompt_version: detection.prompt_version,
        encounter_count: encounterCount + 1,
        acquisition_type: detection.acquisition_type ?? null,
        has_visible_signature: detection.has_visible_signature ?? false,
        is_sealed_package: detection.is_sealed_package ?? false,
        badges,
      })
      .select()
      .single()
  
    if (error) throw error
    return newSnap.id
  }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { photoId } = await req.json()
    if (!photoId) {
      return new Response(JSON.stringify({ error: 'photoId wajib ada' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: photo, error: photoError } = await supabase
      .from('photos').select('*').eq('id', photoId).eq('user_id', user.id).single()
    if (photoError || !photo) {
      return new Response(JSON.stringify({ error: 'Foto tidak ditemukan' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: settings } = await supabase
      .from('user_settings').select('*').eq('user_id', user.id).single()

    const imageRes = await fetch(photo.url)
    if (!imageRes.ok) {
      return new Response(JSON.stringify({ error: 'Gagal fetch foto' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const buffer = await imageRes.arrayBuffer()

    const parsed = await callGemini(buffer, 'image/jpeg')
    const { main, secondary } = sanitizeDetectionResponse(parsed)

    const allowUnknown = settings?.allow_unknown_discovery ?? true
    const isMainUnknown = main.confidence < CONFIDENCE_UNKNOWN_THRESHOLD

    if (isMainUnknown && !allowUnknown) {
      return new Response(JSON.stringify({ error: 'AI tidak cukup yakin — identifikasi dilewati' }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Satu foto = satu entry di Collection — hapus snap lama foto ini dulu
    await supabase.from('snaps').delete().eq('user_id', user.id).eq('photo_id', photoId)

    const snapId = await resolveAndSaveSnap(
      supabase, user.id, photoId,
      { ...main, model_version: MODEL_VERSION, prompt_version: PROMPT_VERSION, is_unknown: isMainUnknown },
      true, photo.location, settings?.home_location ?? null,
    )

    if (settings?.show_secondary_snap) {
      for (const sec of secondary) {
        const isUnknown = sec.confidence < CONFIDENCE_UNKNOWN_THRESHOLD
        if (isUnknown && !allowUnknown) continue
        await resolveAndSaveSnap(
          supabase, user.id, photoId,
          { ...sec, model_version: MODEL_VERSION, prompt_version: PROMPT_VERSION, is_unknown: isUnknown },
          false, photo.location, settings?.home_location ?? null,
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true, snap_id: snapId, detection: { main } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
} catch (error: any) {
    console.error('[detect] Error:', error)
    const isOverload = error.status === 503 || error.message?.includes('UNAVAILABLE')
    return new Response(
      JSON.stringify({
        error: isOverload
          ? 'Server AI sedang sibuk, coba lagi dalam beberapa saat'
          : 'Gagal mendeteksi foto',
      }),
      { status: isOverload ? 503 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})