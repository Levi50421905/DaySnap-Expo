export type ExifValidationResult = {
    valid: boolean
    dateTaken?: Date
    error?: string
  }
  
  function parseExifDateString(raw: string): Date | null {
    // format EXIF standar: "YYYY:MM:DD HH:MM:SS"
    const match = raw.match(/^(\d{4}):(\d{2}):(\d{2})\s(\d{2}):(\d{2}):(\d{2})/)
    if (!match) return null
    const [, y, mo, d, h, mi, s] = match
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s))
  }
  
  // "Hari" bisa dimulai bukan jam 00:00 (setting Jam Pergantian Hari di PDD)
  export function getDayBoundaryDate(dayChangeHour: number, at: Date = new Date()): Date {
    const shifted = new Date(at)
    shifted.setHours(shifted.getHours() - dayChangeHour)
    return shifted
  }
  
  export function formatDateToString(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  
  export function getTodayString(dayChangeHour = 0): string {
    return formatDateToString(getDayBoundaryDate(dayChangeHour))
  }
  
  export function validateExifDate(
    exif: Record<string, any> | null | undefined,
    dayChangeHour = 0,
  ): ExifValidationResult {
    if (!exif) {
      return { valid: false, error: 'Foto tidak memiliki data EXIF' }
    }
  
    const raw: string | undefined = exif.DateTimeOriginal ?? exif.DateTimeDigitized ?? exif.DateTime
    if (!raw) {
      return { valid: false, error: 'Tanggal pengambilan foto tidak ditemukan di EXIF' }
    }
  
    const dateTaken = parseExifDateString(raw)
    if (!dateTaken) {
      return { valid: false, error: 'Format tanggal EXIF tidak dikenali' }
    }
  
    const todayStr = getTodayString(dayChangeHour)
    const takenStr = formatDateToString(getDayBoundaryDate(dayChangeHour, dateTaken))
  
    if (takenStr !== todayStr) {
      const formatted = dateTaken.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      return {
        valid: false,
        dateTaken,
        error: `Foto diambil tanggal ${formatted}. Hanya foto hari ini yang bisa masuk Daily.`,
      }
    }
  
    return { valid: true, dateTaken }
  }