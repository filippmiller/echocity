import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { forecastOfferReach, formatEstimateRange } from '@/modules/analytics/offer-reach-forecast'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== 'BUSINESS_OWNER' && session.role !== 'MERCHANT_STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') || ''
  const category = searchParams.get('category') || ''
  const offerType = searchParams.get('offerType') || ''
  const benefitType = searchParams.get('benefitType') || ''
  const benefitValueRaw = searchParams.get('benefitValue')
  const merchantId = searchParams.get('merchantId') || undefined

  if (!city || !category || !offerType || !benefitType) {
    return NextResponse.json(
      { error: 'Missing required parameters: city, category, offerType, benefitType' },
      { status: 400 }
    )
  }

  const benefitValue = Number(benefitValueRaw)
  if (!Number.isFinite(benefitValue) || benefitValue <= 0) {
    return NextResponse.json({ error: 'Invalid benefitValue' }, { status: 400 })
  }

  // Verify the merchant exists and the user can manage its offers.
  if (merchantId) {
    const accessible = await prisma.business.findFirst({
      where: {
        id: merchantId,
        OR: [
          { ownerId: session.userId },
          { staff: { some: { userId: session.userId, isActive: true, staffRole: 'MANAGER' } } },
        ],
      },
      select: { id: true },
    })
    if (!accessible) {
      return NextResponse.json({ error: 'Business not found or access denied' }, { status: 403 })
    }
  }

  const forecast = await forecastOfferReach({
    city,
    category,
    offerType,
    benefitType,
    benefitValue,
    merchantId,
  })

  return NextResponse.json({
    ...forecast,
    viewRange: formatEstimateRange(forecast.estimatedViews),
    saveRange: formatEstimateRange(forecast.estimatedSaves),
    redemptionRange: formatEstimateRange(forecast.estimatedRedemptions),
  })
}
