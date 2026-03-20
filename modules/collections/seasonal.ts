import { prisma } from '@/lib/prisma'

export interface SeasonalTheme {
  slug: string
  title: string
  description: string
  months: number[] // 1–12
  offerFilter: {
    categories?: string[]
    keywords?: string[]
  }
}

export interface SeasonalOfferCard {
  id: string
  title: string
  subtitle?: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl?: string | null
  branchName: string
  branchAddress: string
  expiresAt?: string | null
  isFlash: boolean
  maxRedemptions?: number | null
}

export interface SeasonalCollection {
  slug: string
  title: string
  description: string
  offers: SeasonalOfferCard[]
}

const SEASONAL_THEMES: SeasonalTheme[] = [
  {
    slug: 'spring-cafe',
    title: 'Весенние террасы',
    description: 'Лучшие скидки в кафе с открытыми верандами',
    months: [4, 5, 6],
    offerFilter: { categories: ['CAFE', 'RESTAURANT'], keywords: ['терраса', 'веранда', 'летн'] },
  },
  {
    slug: 'summer-bar',
    title: 'Летние бары',
    description: 'Освежающие скидки в барах города',
    months: [6, 7, 8],
    offerFilter: { categories: ['BAR'], keywords: ['коктейл', 'пиво', 'летн'] },
  },
  {
    slug: 'winter-warm',
    title: 'Согреться зимой',
    description: 'Уютные скидки для холодных дней',
    months: [12, 1, 2],
    offerFilter: { categories: ['CAFE', 'RESTAURANT'], keywords: ['горяч', 'тёпл', 'зимн', 'какао'] },
  },
  {
    slug: 'beauty-week',
    title: 'Неделя красоты',
    description: 'Скидки на уход и красоту',
    months: [3, 9],
    offerFilter: { categories: ['BEAUTY', 'NAILS', 'HAIR'] },
  },
  {
    slug: 'new-year',
    title: 'Новогодние скидки',
    description: 'Праздничные предложения к Новому году',
    months: [12],
    offerFilter: { keywords: ['новогодн', 'праздничн', 'новый год', 'рождеств'] },
  },
  {
    slug: 'valentines',
    title: 'День влюблённых',
    description: 'Романтические предложения для двоих',
    months: [2],
    offerFilter: { keywords: ['романтич', 'для двоих', 'валентин', 'свидан'] },
  },
  {
    slug: 'weekend-brunch',
    title: 'Выходной бранч',
    description: 'Лучшие предложения на завтраки и бранчи',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    offerFilter: { categories: ['CAFE', 'RESTAURANT'], keywords: ['бранч', 'завтрак', 'утренн'] },
  },
  {
    slug: 'first-visit',
    title: 'Для новичков',
    description: 'Специальные скидки для первого визита',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    offerFilter: { keywords: ['первый визит', 'первое посещение', 'новый клиент'] },
  },
]

/**
 * Returns seasonal collections that are active for the given month
 * and have at least 2 matching offers.
 */
export async function getSeasonalCollections(): Promise<SeasonalCollection[]> {
  // Use Moscow time (UTC+3) to determine current month
  const now = new Date()
  const moscowNow = new Date(now.getTime() + 3 * 60 * 60_000)
  const currentMonth = moscowNow.getUTCMonth() + 1 // 1–12

  // Filter themes active this month
  const activeThemes = SEASONAL_THEMES.filter((t) => t.months.includes(currentMonth))

  const results: SeasonalCollection[] = []

  for (const theme of activeThemes) {
    const { categories, keywords } = theme.offerFilter

    // Build the OR conditions for keyword matching
    const keywordConditions = keywords?.flatMap((kw) => [
      { title: { contains: kw, mode: 'insensitive' as const } },
      { description: { contains: kw, mode: 'insensitive' as const } },
    ]) ?? []

    // Build place type filter
    const placeTypeCondition = categories && categories.length > 0
      ? { branch: { place: { type: { in: categories } } } }
      : {}

    // Build the where clause combining categories and keywords
    const whereClause: Record<string, unknown> = {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      branch: { isActive: true },
    }

    // If we have both categories and keywords, use them with an OR
    if (categories && categories.length > 0 && keywordConditions.length > 0) {
      whereClause.AND = [
        placeTypeCondition,
        { OR: keywordConditions },
      ]
    } else if (categories && categories.length > 0) {
      Object.assign(whereClause, placeTypeCondition)
    } else if (keywordConditions.length > 0) {
      whereClause.OR = keywordConditions
    }

    try {
      const offers = await prisma.offer.findMany({
        where: whereClause as any,
        include: {
          branch: {
            select: { id: true, title: true, address: true, city: true },
          },
          limits: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      })

      if (offers.length < 2) continue

      results.push({
        slug: theme.slug,
        title: theme.title,
        description: theme.description,
        offers: offers.map((o: any) => ({
          id: o.id,
          title: o.title,
          subtitle: o.subtitle,
          offerType: o.offerType,
          visibility: o.visibility,
          benefitType: o.benefitType,
          benefitValue: Number(o.benefitValue),
          imageUrl: o.imageUrl,
          branchName: o.branch.title,
          branchAddress: o.branch.address,
          expiresAt: o.endAt?.toISOString() ?? null,
          isFlash: o.offerType === 'FLASH',
          maxRedemptions: o.limits?.totalLimit ?? null,
        })),
      })
    } catch {
      // Skip this theme if there is a DB error (e.g. relation not yet migrated)
      continue
    }
  }

  return results
}
