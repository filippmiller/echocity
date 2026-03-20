/**
 * Trending offer detection.
 *
 * An offer is "trending" when it has >= 3 successful redemptions in the last 24 hours.
 */

import { prisma } from '@/lib/prisma'

const TRENDING_THRESHOLD = 3 // minimum redemptions in 24h to be considered trending
const TRENDING_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Returns the IDs of trending offers in a given city.
 *
 * @param cityName  - Filter to a specific city (matches `branch.city`).
 * @param limit     - Maximum number of IDs to return (default 20).
 */
export async function getTrendingOfferIds(cityName: string, limit = 20): Promise<string[]> {
  const since = new Date(Date.now() - TRENDING_WINDOW_MS)

  // Group redemptions by offerId for the past 24h, filtered to the target city
  const results = await prisma.redemption.groupBy({
    by: ['offerId'],
    where: {
      status: 'SUCCESS',
      redeemedAt: { gte: since },
      offer: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        branch: { city: cityName, isActive: true },
      },
    },
    _count: { offerId: true },
    having: {
      offerId: { _count: { gte: TRENDING_THRESHOLD } },
    },
    orderBy: { _count: { offerId: 'desc' } },
    take: limit,
  })

  return results.map((r) => r.offerId)
}
