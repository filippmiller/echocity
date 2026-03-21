import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CATEGORY_PLACE_TYPE_MAP: Record<string, string[]> = {
  coffee: ['CAFE'],
  food: ['RESTAURANT'],
  bars: ['BAR'],
  beauty: ['BEAUTY', 'NAILS', 'HAIR'],
  services: ['DRYCLEANING', 'OTHER'],
}

/**
 * GET /api/offers/counts — count active offers per category for a city
 */
export async function GET(req: NextRequest) {
  const cityName = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const now = new Date()

  const baseWhere = {
    lifecycleStatus: 'ACTIVE' as const,
    approvalStatus: 'APPROVED' as const,
    startAt: { lte: now },
    OR: [{ endAt: null }, { endAt: { gt: now } }],
    branch: { city: cityName, isActive: true },
  }

  // Count all + each category in parallel
  const [total, ...categoryCounts] = await Promise.all([
    prisma.offer.count({ where: baseWhere }),
    ...Object.entries(CATEGORY_PLACE_TYPE_MAP).map(([, placeTypes]) =>
      prisma.offer.count({
        where: {
          ...baseWhere,
          branch: { ...baseWhere.branch, placeType: { in: placeTypes as any } },
        },
      })
    ),
  ])

  const categories = Object.keys(CATEGORY_PLACE_TYPE_MAP)
  const counts: Record<string, number> = { all: total }
  categories.forEach((cat, i) => {
    counts[cat] = categoryCounts[i]
  })

  return NextResponse.json({ counts })
}
