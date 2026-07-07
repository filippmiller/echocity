import { NextRequest, NextResponse } from 'next/server'
import {
  getLunchOffers,
  getTonightOffers,
  getAfterWorkOffers,
} from '@/modules/collections/curated'
import { logger } from '@/lib/logger'

function mapOfferToApi(offer: any) {
  return {
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle,
    offerType: offer.offerType,
    visibility: offer.visibility,
    benefitType: offer.benefitType,
    benefitValue: Number(offer.benefitValue),
    imageUrl: offer.imageUrl,
    branchName: offer.branch?.title ?? '',
    branchAddress: offer.branch?.address ?? '',
    branchLat: offer.branch?.lat ?? null,
    branchLng: offer.branch?.lng ?? null,
    nearestMetro: offer.branch?.nearestMetro ?? null,
    isVerified: offer.merchant?.isVerified ?? false,
    redemptionCount: offer._count?.redemptions ?? 0,
    maxRedemptions: offer.limits?.totalLimit ?? null,
    expiresAt: offer.endAt?.toISOString() ?? null,
    isFlash: offer.offerType === 'FLASH',
    reviewCount: offer._count?.offerReviews ?? 0,
    schedules: (offer.schedules ?? []).map((s: any) => ({
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city') || undefined
    const district = searchParams.get('district') || undefined

    const [lunch, tonight, afterWork] = await Promise.all([
      getLunchOffers(city, district),
      getTonightOffers(city, district),
      getAfterWorkOffers(city, district),
    ])

    const sections = []

    if (lunch.length > 0) {
      sections.push({
        slug: 'lunch-nearby',
        title: 'Обед рядом',
        emoji: '🍽️',
        offers: lunch.map(mapOfferToApi),
      })
    }

    if (tonight.length > 0) {
      sections.push({
        slug: 'tonight',
        title: 'Сегодня вечером',
        emoji: '🌃',
        offers: tonight.map(mapOfferToApi),
      })
    }

    if (afterWork.length > 0) {
      sections.push({
        slug: 'after-work',
        title: 'После работы',
        emoji: '🍻',
        offers: afterWork.map(mapOfferToApi),
      })
    }

    return NextResponse.json({ sections })
  } catch (error) {
    logger.error('collections.time-of-day.error', { error: String(error) })
    return NextResponse.json({ sections: [] })
  }
}
