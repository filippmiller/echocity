import { prisma } from '@/lib/prisma'
import { getEstimatedSavings } from '@/lib/offer-utils'

export interface ContentQualityReportItem {
  id: string
  title?: string
  name?: string
  city?: string
  benefitType?: string
  benefitValue?: number
  metadata?: unknown
  createdAt?: string
}

export interface ContentQualityReportSection {
  count: number
  items: ContentQualityReportItem[]
}

export interface ContentQualityReport {
  offersWithoutImages: ContentQualityReportSection
  placesWithoutSchedule: ContentQualityReportSection
  offersWithoutSavingsData: ContentQualityReportSection
  pendingBusinesses: ContentQualityReportSection
  emptyCityInventory: ContentQualityReportSection
  checkedAt: string
}

const DEFAULT_SAMPLE_LIMIT = 20

/**
 * Build a production content quality checklist for the admin dashboard.
 *
 * Checks:
 * - Offers without images
 * - Places without schedule (openingHours)
 * - Offers whose savings cannot be estimated from metadata
 * - Pending business registrations
 * - Cities with no active places (empty inventory)
 */
export async function getContentQualityReport(
  sampleLimit = DEFAULT_SAMPLE_LIMIT
): Promise<ContentQualityReport> {
  const [
    activeOffers,
    activePlaces,
    pendingBusinesses,
    citiesWithPlaceCounts,
  ] = await Promise.all([
    prisma.offer.findMany({
      where: { lifecycleStatus: { in: ['ACTIVE', 'SCHEDULED'] } },
      select: {
        id: true,
        title: true,
        benefitType: true,
        benefitValue: true,
        imageUrl: true,
        metadata: true,
        createdAt: true,
        merchant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.place.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        city: true,
        openingHours: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.business.findMany({
      where: { status: 'PENDING' },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: sampleLimit,
    }),
    prisma.city.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { places: { where: { isActive: true } } } },
      },
    }),
  ])

  const offersWithoutImages = activeOffers.filter(
    (offer) => !offer.imageUrl || offer.imageUrl.trim().length === 0
  )

  const offersWithoutSavingsData = activeOffers.filter((offer) => {
    const savings = getEstimatedSavings(
      offer.benefitType,
      Number(offer.benefitValue),
      offer.metadata
    )
    return savings === null
  })

  const placesWithoutSchedule = activePlaces.filter(
    (place) =>
      !place.openingHours ||
      (typeof place.openingHours === 'object' &&
        !Array.isArray(place.openingHours) &&
        Object.keys(place.openingHours as Record<string, unknown>).length === 0)
  )

  const emptyCityInventory = citiesWithPlaceCounts.filter(
    (city) => city._count.places === 0
  )

  return {
    offersWithoutImages: {
      count: offersWithoutImages.length,
      items: offersWithoutImages.slice(0, sampleLimit).map((offer) => ({
        id: offer.id,
        title: offer.title,
        name: offer.merchant.name,
        benefitType: offer.benefitType,
        createdAt: offer.createdAt.toISOString(),
      })),
    },
    placesWithoutSchedule: {
      count: placesWithoutSchedule.length,
      items: placesWithoutSchedule.slice(0, sampleLimit).map((place) => ({
        id: place.id,
        title: place.title,
        city: place.city,
      })),
    },
    offersWithoutSavingsData: {
      count: offersWithoutSavingsData.length,
      items: offersWithoutSavingsData.slice(0, sampleLimit).map((offer) => ({
        id: offer.id,
        title: offer.title,
        benefitType: offer.benefitType,
        benefitValue: Number(offer.benefitValue),
        createdAt: offer.createdAt.toISOString(),
      })),
    },
    pendingBusinesses: {
      count: pendingBusinesses.length,
      items: pendingBusinesses.map((business) => ({
        id: business.id,
        name: business.name,
        createdAt: business.createdAt.toISOString(),
      })),
    },
    emptyCityInventory: {
      count: emptyCityInventory.length,
      items: emptyCityInventory.map((city) => ({
        id: city.id,
        name: city.name,
        city: city.slug,
      })),
    },
    checkedAt: new Date().toISOString(),
  }
}
