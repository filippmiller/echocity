import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getForYouSection } from '@/modules/recommendations/engine'

/**
 * GET /api/offers/recommended
 * Returns personalized offers for the logged-in user, or trending for guests.
 *
 * Query params:
 *   city  - city name (default: "Санкт-Петербург")
 *   limit - max results (default 10, max 50)
 */
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const limitStr = req.nextUrl.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitStr || '10') || 10, 1), 50)

  const session = await getSession().catch(() => null)
  const userId = session?.userId ?? null

  const { offers, isPersonalized } = await getForYouSection(userId, city)

  const result = offers.slice(0, limit).map((o) => ({
    id: o.id,
    title: o.title,
    subtitle: o.subtitle,
    offerType: o.offerType,
    visibility: o.visibility,
    benefitType: o.benefitType,
    benefitValue: o.benefitValue,
    imageUrl: o.imageUrl,
    branchName: o.branch.title,
    branchAddress: o.branch.address,
    expiresAt: o.endAt,
    isFlash: o.offerType === 'FLASH',
    maxRedemptions: o.maxRedemptions,
    redemptionChannel: o.redemptionChannel,
    score: o.score,
  }))

  return NextResponse.json({
    offers: result,
    isPersonalized,
    count: result.length,
  })
}
