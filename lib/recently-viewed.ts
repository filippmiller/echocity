const STORAGE_KEY = 'echocity_recently_viewed'
const MAX_ITEMS = 10

export interface RecentlyViewedItem {
  id: string
  title: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branchName: string
  viewedAt: number
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  try {
    const existing = getRecentlyViewed()
    const filtered = existing.filter((i) => i.id !== item.id)
    filtered.unshift({ ...item, viewedAt: Date.now() })
    const trimmed = filtered.slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage unavailable
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentlyViewedItem[]
  } catch {
    return []
  }
}
