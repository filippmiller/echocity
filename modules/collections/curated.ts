/**
 * Curated local collections for consumer discovery.
 *
 * These collections are populated dynamically from existing offer/place data
 * so they stay useful even when no editorial items have been hand-picked.
 */

import { prisma } from '@/lib/prisma'
import { getMoscowTimeInfo, isOfferActiveNow, isBlackoutDate } from '@/lib/schedule-utils'

export interface CuratedCollection {
  slug: string
  title: string
  description: string
  emoji: string
  itemCount: number
  items: Array<{ type: 'offer' | 'place'; id: string }>
}

export const CURATED_COLLECTIONS = {
  coffee: {
    slug: 'coffee-nearby',
    title: 'Кофе рядом',
    description: 'Лучшие кофейни и кофейные предложения рядом с вами',
    emoji: '☕',
  },
  lunch: {
    slug: 'lunch-under-500',
    title: 'Обед до 500 ₽',
    description: 'Выгодные обеды, бизнес-ланчи и фиксированные цены до 500 рублей',
    emoji: '🍽️',
  },
  evening: {
    slug: 'tonight-plans',
    title: 'Планы на вечер',
    description: 'Активные предложения для вечера: бары, рестораны и события',
    emoji: '🌃',
  },
}

function getMoscowNow() {
  return new Date(Date.now() + 3 * 60 * 60 * 1000)
}

/**
 * Return curated collection summaries for the given city.
 * Items are resolved lazily on the collection detail page, so this only
 * returns counts and metadata for discovery entry points.
 */
export async function getCuratedCollections(cityName?: string): Promise<CuratedCollection[]> {
  const now = new Date()
  const moscowNow = getMoscowNow()
  const tonightEnd = new Date(now.getTime() + 12 * 60 * 60 * 1000)

  const baseWhere: any = {
    lifecycleStatus: 'ACTIVE' as const,
    approvalStatus: 'APPROVED' as const,
    startAt: { lte: now },
    OR: [{ endAt: null }, { endAt: { gt: now } }],
    branch: { isActive: true, ...(cityName ? { city: cityName } : {}) },
  }

  const [coffeeOffers, lunchOffers, eveningOffers] = await Promise.all([
    prisma.offer.findMany({
      where: {
        ...baseWhere,
        branch: { ...baseWhere.branch, placeType: { in: ['CAFE'] } },
      },
      select: { id: true },
      take: 20,
    }),
    prisma.offer.findMany({
      where: {
        ...baseWhere,
        OR: [
          { benefitType: 'FIXED_PRICE', benefitValue: { lte: 500 } },
          { branch: { averageCheck: { lte: 500 } } },
        ],
      },
      select: { id: true },
      take: 20,
    }),
    prisma.offer.findMany({
      where: {
        ...baseWhere,
        endAt: { lte: tonightEnd },
        branch: { ...baseWhere.branch, placeType: { in: ['BAR', 'RESTAURANT'] } },
      },
      select: { id: true },
      take: 20,
    }),
  ])

  return [
    {
      ...CURATED_COLLECTIONS.coffee,
      itemCount: coffeeOffers.length,
      items: coffeeOffers.map((o) => ({ type: 'offer' as const, id: o.id })),
    },
    {
      ...CURATED_COLLECTIONS.lunch,
      itemCount: lunchOffers.length,
      items: lunchOffers.map((o) => ({ type: 'offer' as const, id: o.id })),
    },
    {
      ...CURATED_COLLECTIONS.evening,
      itemCount: eveningOffers.length,
      items: eveningOffers.map((o) => ({ type: 'offer' as const, id: o.id })),
    },
  ].filter((c) => c.itemCount > 0)
}

/**
 * Return a single curated collection with its items resolved from live data.
 * Returns null if the slug is not a known curated collection.
 */
export async function getCuratedCollectionBySlug(
  slug: string,
  cityName?: string
): Promise<Omit<CuratedCollection, 'items'> & { items: any[] }> {
  const collections = await getCuratedCollections(cityName)
  const collection = collections.find((c) => c.slug === slug)
  if (!collection) throw new Error('Unknown curated collection slug')

  const offers = await prisma.offer.findMany({
    where: { id: { in: collection.items.map((i) => i.id) } },
    include: {
      branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true } },
      merchant: { select: { id: true, name: true, isVerified: true } },
      limits: true,
      _count: { select: { redemptions: true, offerReviews: true } },
    },
  })

  return {
    ...collection,
    items: offers.map((offer) => ({
      type: 'offer' as const,
      data: offer,
    })),
  }
}

/**
 * Upsert curated collections into the database so they appear in existing
 * collection APIs and admin tooling. Items are not stored here because they
 * are resolved dynamically from live offer/place data.
 */
export async function upsertCuratedCollections(): Promise<void> {
  const now = new Date()
  for (const [key, config] of Object.entries(CURATED_COLLECTIONS)) {
    await prisma.collection.upsert({
      where: { slug: config.slug },
      update: {
        title: config.title,
        description: config.description,
        isFeatured: true,
        isActive: true,
        type: 'ALGORITHMIC',
        updatedAt: now,
      },
      create: {
        slug: config.slug,
        title: config.title,
        description: config.description,
        isFeatured: true,
        isActive: true,
        type: 'ALGORITHMIC',
        sortOrder: { coffee: 1, lunch: 2, evening: 3 }[key] ?? 0,
      },
    })
  }
}

const timeOfDayInclude = {
  schedules: true,
  blackoutDates: { select: { date: true } },
  branch: {
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      lat: true,
      lng: true,
      nearestMetro: true,
      placeType: true,
    },
  },
  merchant: { select: { id: true, name: true, isVerified: true } },
  limits: true,
  _count: { select: { redemptions: true, offerReviews: true } },
}

interface TimeOfDayConfig {
  start: string
  end: string
  placeTypes: string[]
  categories?: string[]
}

async function fetchTimeOfDayOffers(
  config: TimeOfDayConfig,
  cityName?: string,
  districtSlug?: string
) {
  const { weekday, timeStr } = getMoscowTimeInfo()
  if (weekday > 4 || timeStr < config.start || timeStr >= config.end) {
    return []
  }

  const now = new Date()
  const branchWhere: any = {
    isActive: true,
    ...(cityName ? { city: cityName } : {}),
    ...(districtSlug ? { district: { slug: districtSlug } } : {}),
  }

  const typeFilters: any[] = [{ placeType: { in: config.placeTypes } }]
  if (config.categories && config.categories.length > 0) {
    typeFilters.push({ category: { in: config.categories } })
  }

  const offers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
      branch: {
        ...branchWhere,
        OR: typeFilters,
      },
    },
    include: timeOfDayInclude,
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return offers.filter((offer: any) => {
    if (isBlackoutDate(offer.blackoutDates, now)) return false
    return isOfferActiveNow(offer.schedules, now)
  })
}

/**
 * Weekday lunch offers (Mon–Fri, 12:00–15:00) active right now.
 * Includes cafes, restaurants and food/coffee places.
 */
export async function getLunchOffers(cityName?: string, districtSlug?: string) {
  return fetchTimeOfDayOffers(
    {
      start: '12:00',
      end: '15:00',
      placeTypes: ['CAFE', 'RESTAURANT'],
      categories: ['CAFE', 'RESTAURANT'],
    },
    cityName,
    districtSlug
  )
}

/**
 * Tonight plans (Mon–Fri, 17:00–23:00) active right now.
 * Includes bars and restaurants.
 */
export async function getTonightOffers(cityName?: string, districtSlug?: string) {
  return fetchTimeOfDayOffers(
    {
      start: '17:00',
      end: '23:00',
      placeTypes: ['BAR', 'RESTAURANT'],
      categories: ['BAR', 'RESTAURANT'],
    },
    cityName,
    districtSlug
  )
}

/**
 * After-work offers (Mon–Fri, 17:00–20:00) active right now.
 * Includes bars, restaurants and cafes.
 */
export async function getAfterWorkOffers(cityName?: string, districtSlug?: string) {
  return fetchTimeOfDayOffers(
    {
      start: '17:00',
      end: '20:00',
      placeTypes: ['BAR', 'RESTAURANT', 'CAFE'],
      categories: ['BAR', 'RESTAURANT', 'CAFE'],
    },
    cityName,
    districtSlug
  )
}
