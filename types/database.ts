export type Photo = {
    id: string
    user_id: string
    url: string
    thumbnail_url: string | null
    date_taken: string // YYYY-MM-DD
    date_uploaded: string
    caption: string | null
    is_pinned: boolean
    exif_raw: Record<string, unknown> | null
    location: PhotoLocation | null
    created_at: string
  }
  
  export type PhotoLocation = {
    country?: string
    region?: string
    city?: string
    lat?: number
    lng?: number
  }
  
  export type Snap = {
    id: string
    user_id: string
    photo_id: string
    canonical_key: string
    scientific_name: string | null
    common_name_en: string
    common_name_id: string | null
    category: string | null
    global_rarity: string
    current_rarity: string
    accessibility: string | null
    discovery_context: string | null
    photo_location: PhotoLocation | null
    native_region: string | null
    condition_note: string | null
    context_note: string | null
    confidence: number | null
    model_version: string | null
    prompt_version: string | null
    is_main: boolean
    encounter_count: number
    first_discovered_at: string
    created_at: string
  }
  
  export type Memory = {
    id: string
    user_id: string
    photo_id: string
    title: string
    reason: string | null
    created_at: string
  }
  
  export type UserSettings = {
    user_id: string
    reminder_time: string
    allow_pin_after_day: boolean
    timezone: string
    auto_ai_detection: boolean
    show_secondary_snap: boolean
    allow_unknown_discovery: boolean
    calendar_start_day: string
    app_language: string
    collection_language: string
    show_scientific_names: boolean
    notif_daily_reminder: boolean
    notif_discovery: boolean
    notif_monthly_recap: boolean
  }