export function groupSnapsByPhoto<T extends { photo_id: string }>(snaps: T[]): T[] {
    const grouped = new Map<string, T>()
    for (const snap of snaps) {
      if (!grouped.has(snap.photo_id)) {
        grouped.set(snap.photo_id, snap)
      }
    }
    return Array.from(grouped.values())
  }