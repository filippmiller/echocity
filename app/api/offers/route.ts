import { NextRequest, NextResponse } from 'next/server'
import { getActiveOffersByCity } from '@/modules/offers/service'

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const visibility = req.nextUrl.searchParams.get('visibility') || undefined
  const category = req.nextUrl.searchParams.get('category') || undefined
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '50') || 50, 1), 100)
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0') || 0, 0)

  const rawOffers = await getActiveOffersByCity(city, { visibility, category, limit, offset })

  // Enrich response with computed fields
  const offers = rawOffers.map((offer: any) => ({
    ...offer,
    expiresAt: offer.endAt?.toISOString() ?? null,
    redemptionCount: offer._count?.redemptions ?? 0,
    maxRedemptions: offer.limits?.totalLimit ?? null,
    isFlash: offer.offerType === 'FLASH',
  }))

  return NextResponse.json({ offers })
}
