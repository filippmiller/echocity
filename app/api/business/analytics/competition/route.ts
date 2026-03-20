import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  CAFE: 'Кафе',
  RESTAURANT: 'Ресторан',
  BAR: 'Бар',
  BEAUTY: 'Красота',
  NAILS: 'Маникюр',
  HAIR: 'Парикмахерская',
  DRYCLEANING: 'Химчистка',
  BARBERSHOP: 'Барбершоп',
  OTHER: 'Другое',
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the merchant's businesses
  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId, status: 'APPROVED' },
    select: { id: true, type: true },
  })

  if (businesses.length === 0) {
    return NextResponse.json({ error: 'No active businesses found' }, { status: 404 })
  }

  // Use the type of the first business as the "category"
  const merchantIds = businesses.map((b) => b.id)
  const categoryType = businesses[0].type
  const categoryLabel = BUSINESS_TYPE_LABELS[categoryType] || categoryType

  // === Merchant's own stats ===
  const [merchantOffers, merchantRedemptions] = await Promise.all([
    // Active offers for this merchant with discount values
    prisma.offer.findMany({
      where: {
        merchantId: { in: merchantIds },
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        benefitType: 'PERCENT',
      },
      select: { id: true, benefitValue: true },
    }),

    // Redemptions in the last 30 days per offer
    prisma.redemption.groupBy({
      by: ['offerId'],
      _count: { id: true },
      where: {
        merchantId: { in: merchantIds },
        status: 'SUCCESS',
        redeemedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  // Merchant average discount
  const merchantAvgDiscount =
    merchantOffers.length > 0
      ? Math.round(
          merchantOffers.reduce((sum, o) => sum + Number(o.benefitValue), 0) /
            merchantOffers.length
        )
      : 0

  // Merchant average redemptions per offer (last 30 days)
  const merchantTotalRedemptions30d = merchantRedemptions.reduce(
    (sum, r) => sum + r._count.id,
    0
  )
  const merchantActiveOfferCount = merchantOffers.length
  const merchantAvgRedemptionsPerOffer =
    merchantActiveOfferCount > 0
      ? Math.round(merchantTotalRedemptions30d / merchantActiveOfferCount)
      : 0

  // === Category-wide stats (all OTHER merchants in same category) ===
  // Find all businesses with this type (excluding this merchant)
  const categoryBusinesses = await prisma.business.findMany({
    where: {
      type: categoryType,
      status: 'APPROVED',
      id: { notIn: merchantIds },
    },
    select: { id: true },
    take: 200, // cap to avoid huge queries
  })

  const competitorIds = categoryBusinesses.map((b) => b.id)
  const totalCompetitors = competitorIds.length

  if (totalCompetitors === 0) {
    // No competitors yet — return merchant stats with no category comparison
    return NextResponse.json({
      categoryLabel,
      categoryType,
      merchant: {
        avgDiscount: merchantAvgDiscount,
        activeOffers: merchantActiveOfferCount,
        avgRedemptionsPerOffer: merchantAvgRedemptionsPerOffer,
      },
      category: {
        avgDiscount: merchantAvgDiscount,
        activeOffers: merchantActiveOfferCount,
        avgRedemptionsPerOffer: merchantAvgRedemptionsPerOffer,
        merchantCount: 1,
      },
      suggestion: null,
    })
  }

  const [categoryOffers, categoryRedemptions] = await Promise.all([
    prisma.offer.findMany({
      where: {
        merchantId: { in: competitorIds },
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        benefitType: 'PERCENT',
      },
      select: { id: true, benefitValue: true, merchantId: true },
    }),

    prisma.redemption.groupBy({
      by: ['offerId'],
      _count: { id: true },
      where: {
        merchantId: { in: competitorIds },
        status: 'SUCCESS',
        redeemedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  // Category average discount
  const categoryAvgDiscount =
    categoryOffers.length > 0
      ? Math.round(
          categoryOffers.reduce((sum, o) => sum + Number(o.benefitValue), 0) /
            categoryOffers.length
        )
      : 0

  // Category total active offers
  const categoryActiveOffers = categoryOffers.length

  // Category average redemptions per offer (last 30 days)
  const categoryTotalRedemptions30d = categoryRedemptions.reduce(
    (sum, r) => sum + r._count.id,
    0
  )
  const categoryAvgRedemptionsPerOffer =
    categoryActiveOffers > 0
      ? Math.round(categoryTotalRedemptions30d / categoryActiveOffers)
      : 0

  // Compute uplift ratio: how many times more redemptions do higher-discount offers get?
  // Use a rough 2x assumption if we don't have enough data
  const upliftRatio =
    merchantAvgRedemptionsPerOffer > 0 && categoryAvgRedemptionsPerOffer > 0
      ? Math.round((categoryAvgRedemptionsPerOffer / merchantAvgRedemptionsPerOffer) * 10) / 10
      : 2

  // === Contextual suggestion ===
  let suggestion: string | null = null

  if (merchantAvgDiscount < categoryAvgDiscount) {
    const ratio = upliftRatio > 1 ? upliftRatio : 2
    suggestion = `Увеличьте скидку — заведения с большей скидкой получают в ${ratio} раза больше клиентов`
  } else if (merchantAvgDiscount >= categoryAvgDiscount) {
    suggestion = 'Отлично! Вы предлагаете лучшие условия в категории'
  }

  return NextResponse.json({
    categoryLabel,
    categoryType,
    merchant: {
      avgDiscount: merchantAvgDiscount,
      activeOffers: merchantActiveOfferCount,
      avgRedemptionsPerOffer: merchantAvgRedemptionsPerOffer,
    },
    category: {
      avgDiscount: categoryAvgDiscount,
      activeOffers: categoryActiveOffers,
      avgRedemptionsPerOffer: categoryAvgRedemptionsPerOffer,
      merchantCount: totalCompetitors + 1,
    },
    suggestion,
  })
}
