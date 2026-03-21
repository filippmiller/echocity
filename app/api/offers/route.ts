import { NextRequest, NextResponse } from 'next/server'
import { getActiveOffersByCity } from '@/modules/offers/service'
import { getTrendingOfferIds } from '@/modules/offers/trending'

// Returns Moscow weekday (0=Monday..6=Sunday) and HH:MM time string
function getMoscowTimeInfo(): { weekday: number; timeStr: string } {
  const now = new Date()
  const moscowOffset = 3 * 60 // UTC+3 in minutes
  const moscow = new Date(now.getTime() + moscowOffset * 60_000)
  const weekday = (moscow.getUTCDay() + 6) % 7 // 0=Monday
  const timeStr = `${String(moscow.getUTCHours()).padStart(2, '0')}:${String(moscow.getUTCMinutes()).padStart(2, '0')}`
  return { weekday, timeStr }
}

function isOfferActiveNow(schedules: Array<{ weekday: number; startTime: string; endTime: string; isBlackout?: boolean }>, weekday: number, timeStr: string): boolean {
  // No schedules = always active
  if (!schedules || schedules.length === 0) return true
  const activeSchedules = schedules.filter((s) => !s.isBlackout)
  if (activeSchedules.length === 0) return true
  return activeSchedules.some(
    (s) => s.weekday === weekday && s.startTime <= timeStr && s.endTime > timeStr
  )
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const visibility = req.nextUrl.searchParams.get('visibility') || undefined
  const category = req.nextUrl.searchParams.get('category') || undefined
  const metro = req.nextUrl.searchParams.get('metro') || undefined
  const activeNow = req.nextUrl.searchParams.get('activeNow') === 'true'
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '50') || 50, 1), 100)
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0') || 0, 0)

  const [rawOffers, trendingIds] = await Promise.all([
    getActiveOffersByCity(city, { visibility, category, metro, limit, offset }),
    getTrendingOfferIds(city),
  ])

  const trendingSet = new Set(trendingIds)

  let filtered = rawOffers as any[]

  if (activeNow) {
    const { weekday, timeStr } = getMoscowTimeInfo()
    filtered = filtered.filter((offer) => isOfferActiveNow(offer.schedules ?? [], weekday, timeStr))
  }

  // Enrich response with computed fields
  const offers = filtered.map((offer: any) => ({
    ...offer,
    expiresAt: offer.endAt?.toISOString() ?? null,
    redemptionCount: offer._count?.redemptions ?? 0,
    maxRedemptions: offer.limits?.totalLimit ?? null,
    isFlash: offer.offerType === 'FLASH',
    isTrending: trendingSet.has(offer.id),
    schedules: (offer.schedules ?? []).map((s: any) => ({
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    nearestMetro: offer.branch?.nearestMetro ?? null,
    isVerified: offer.merchant?.isVerified ?? false,
    reviewCount: offer._count?.offerReviews ?? 0,
  }))

  return NextResponse.json({ offers })
}
