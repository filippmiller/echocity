import { NextRequest, NextResponse } from 'next/server'
import { getSimilarOffers } from '@/modules/recommendations/engine'

/**
 * GET /api/offers/[id]/similar
 * Returns similar offers for a given offer ID.
 *
 * Query params:
 *   limit - max results (default 5, max 20)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
  }

  const limitStr = req.nextUrl.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitStr || '5') || 5, 1), 20)

  const similar = await getSimilarOffers(id, limit)

  const result = similar.map((o) => ({
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
  }))

  return NextResponse.json({ offers: result, count: result.length })
}
