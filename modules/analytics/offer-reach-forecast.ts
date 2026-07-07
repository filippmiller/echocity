import { prisma } from '@/lib/prisma'
import type { Prisma, OfferType, BenefitType, BusinessType } from '@prisma/client'

export interface ForecastOfferReachInput {
  city: string
  category: string // maps to Place.placeType / Business.type
  offerType: string
  benefitType: string
  benefitValue: number
  merchantId?: string
}

export interface OfferReachForecast {
  estimatedViews: number | null
  estimatedSaves: number | null
  estimatedRedemptions: number | null
  confidence: 'low' | 'medium' | 'high'
  explanation: string
  basedOnHistory: boolean
}

const HISTORY_WINDOW_DAYS = 90
const MIN_SIMILAR_OFFERS = 3
const HIGH_CONFIDENCE_MIN_OFFERS = 10

function getHistoryCutoff(allTime: boolean): Date {
  const d = new Date()
  if (allTime) {
    d.setFullYear(d.getFullYear() - 10)
    return d
  }
  d.setDate(d.getDate() - HISTORY_WINDOW_DAYS)
  return d
}

function roundConservative(n: number): number {
  return Math.max(0, Math.round(n))
}

export function formatEstimateRange(value: number | null): string | null {
  if (value === null || value <= 0) return null
  const lower = Math.max(0, Math.round(value * 0.6))
  const upper = Math.round(value * 1.4)
  if (lower >= upper) return `≈ ${upper}`
  return `${lower}–${upper}`
}

/**
 * Forecast offer reach based on historical averages of similar offers.
 *
 * Similarity is defined as same city and category. We further tighten the
 * comparison when enough data exists by matching offerType and benefitType.
 * If fewer than MIN_SIMILAR_OFFERS matching offers exist, returns a
 * documented fallback with no fake precision.
 */
export async function forecastOfferReach(
  input: ForecastOfferReachInput
): Promise<OfferReachForecast> {
  const city = input.city.trim()
  const category = input.category.trim()
  if (!city || !category) {
    return fallbackForecast('Укажите город и категорию заведения для оценки охвата.')
  }

  // Try strict match first (same offerType + benefitType), then loosen.
  let offers = await findSimilarOffers(input, true)
  let strict = true
  if (offers.length < MIN_SIMILAR_OFFERS) {
    offers = await findSimilarOffers(input, false)
    strict = false
  }

  if (offers.length < MIN_SIMILAR_OFFERS) {
    return fallbackForecast(
      'Недостаточно данных по похожим предложениям. Ориентировочный охват в вашем городе: 30–80 просмотров.'
    )
  }

  const offerIds = offers.map((o) => o.id)
  const useAllTime = offers.length < HIGH_CONFIDENCE_MIN_OFFERS
  const cutoff = getHistoryCutoff(useAllTime)

  const [viewCounts, saveCounts, redemptionCounts] = await Promise.all([
    prisma.offerView.groupBy({
      by: ['offerId'],
      _count: { id: true },
      where: { offerId: { in: offerIds }, createdAt: { gte: cutoff } },
    }),
    prisma.offerSave.groupBy({
      by: ['offerId'],
      _count: { id: true },
      where: { offerId: { in: offerIds }, createdAt: { gte: cutoff } },
    }),
    prisma.redemption.groupBy({
      by: ['offerId'],
      _count: { id: true },
      where: { offerId: { in: offerIds }, redeemedAt: { gte: cutoff }, status: 'SUCCESS' },
    }),
  ])

  const viewMap = new Map(viewCounts.map((c) => [c.offerId, c._count.id]))
  const saveMap = new Map(saveCounts.map((c) => [c.offerId, c._count.id]))
  const redemptionMap = new Map(redemptionCounts.map((c) => [c.offerId, c._count.id]))

  const totalViews = offers.reduce((sum, o) => sum + (viewMap.get(o.id) || 0), 0)
  const totalSaves = offers.reduce((sum, o) => sum + (saveMap.get(o.id) || 0), 0)
  const totalRedemptions = offers.reduce((sum, o) => sum + (redemptionMap.get(o.id) || 0), 0)

  const avgViews = totalViews / offers.length
  const avgSaves = totalSaves / offers.length
  const avgRedemptions = totalRedemptions / offers.length

  // Apply a conservative discount because the new offer has no track record yet.
  const conservatismFactor = 0.7
  const estimatedViews = roundConservative(avgViews * conservatismFactor)
  const estimatedSaves = roundConservative(avgSaves * conservatismFactor)
  const estimatedRedemptions = roundConservative(avgRedemptions * conservatismFactor)

  const confidence =
    offers.length >= HIGH_CONFIDENCE_MIN_OFFERS && !useAllTime
      ? 'high'
      : offers.length >= MIN_SIMILAR_OFFERS
        ? 'medium'
        : 'low'

  const matchScope = strict
    ? 'с таким типом и выгодой'
    : 'в той же категории и городе'

  const timeScope = useAllTime ? 'за всё время' : 'за последние 90 дней'

  return {
    estimatedViews: estimatedViews > 0 ? estimatedViews : null,
    estimatedSaves: estimatedSaves > 0 ? estimatedSaves : null,
    estimatedRedemptions: estimatedRedemptions > 0 ? estimatedRedemptions : null,
    confidence,
    basedOnHistory: true,
    explanation: `Оценка основана на ${offers.length} похожих предложениях ${matchScope} ${timeScope}. Прогноз занижен на 30 %, чтобы не завышать ожидания.`,
  }
}

function fallbackForecast(explanation: string): OfferReachForecast {
  return {
    estimatedViews: null,
    estimatedSaves: null,
    estimatedRedemptions: null,
    confidence: 'low',
    basedOnHistory: false,
    explanation,
  }
}

async function findSimilarOffers(
  input: ForecastOfferReachInput,
  strict: boolean
): Promise<Array<{ id: string }>> {
  const where: Prisma.OfferWhereInput = {
    approvalStatus: 'APPROVED',
    lifecycleStatus: { not: 'ARCHIVED' },
    branch: {
      city: input.city.trim(),
      placeType: input.category.trim() as BusinessType,
    },
  }

  if (strict) {
    where.offerType = input.offerType as OfferType
    where.benefitType = input.benefitType as BenefitType
  }

  // Exclude the merchant's own historical offers if merchantId is provided,
  // to avoid leaking private performance data into the merchant-scoped forecast.
  if (input.merchantId) {
    where.merchantId = { not: input.merchantId }
  }

  return prisma.offer.findMany({
    where,
    select: { id: true },
    take: 200,
  })
}
