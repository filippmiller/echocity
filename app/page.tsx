export const dynamic = 'force-dynamic'

import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { OfferCard } from "@/components/OfferCard"
import { BundleCard } from "@/components/BundleCard"
import { Footer } from "@/components/Footer"
import { SavingsCounter } from "@/components/SavingsCounter"
import { HomeCityBadge } from "@/components/HomeCityBadge"
import { CollectionCard } from "@/components/CollectionCard"
import { HomeStoriesBar } from "@/components/HomeStoriesBar"
import { ForYouSection } from "@/components/ForYouSection"
import { NearYouSection } from "@/components/NearYouSection"
import { DealOfTheDay } from "@/components/DealOfTheDay"
import { getSeasonalCollections, type SeasonalCollection } from "@/modules/collections/seasonal"
import { getCuratedCollections, type CuratedCollection } from "@/modules/collections/curated"

const CATEGORIES = [
  { name: 'Кофе', slug: 'coffee', emoji: '☕', types: ['CAFE'] },
  { name: 'Еда', slug: 'food', emoji: '🍔', types: ['RESTAURANT'] },
  { name: 'Бары', slug: 'bars', emoji: '🍺', types: ['BAR'] },
  { name: 'Красота', slug: 'beauty', emoji: '💅', types: ['BEAUTY', 'NAILS', 'HAIR'] },
  { name: 'Услуги', slug: 'services', emoji: '🔧', types: ['DRYCLEANING', 'OTHER'] },
]

/** Russian numeral agreement: 1 скидка, 2 скидки, 5 скидок */
function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const lastDigit = abs % 10
  if (abs > 10 && abs < 20) return many
  if (lastDigit === 1) return one
  if (lastDigit >= 2 && lastDigit <= 4) return few
  return many
}

async function getHomeData() {
  const now = new Date()
  // Start of today in Moscow time (UTC+3)
  const moscowNow = new Date(now.getTime() + 3 * 60 * 60_000)
  const startOfTodayMoscow = new Date(
    Date.UTC(moscowNow.getUTCFullYear(), moscowNow.getUTCMonth(), moscowNow.getUTCDate(), 0, 0, 0)
  )
  const startOfToday = new Date(startOfTodayMoscow.getTime() - 3 * 60 * 60_000)

  const [freeOffers, memberOffers, flashOffers, allActive, demandCount, placeCount, collections, activeBundles, seasonalCollections, dealOfTheDay, curatedCollections] = await Promise.all([
    // Free deals
    prisma.offer.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        visibility: 'FREE_FOR_ALL',
        branch: { isActive: true },
      },
      include: {
        branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true } },
        merchant: { select: { id: true, name: true } },
        limits: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    // Members-only deals
    prisma.offer.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        visibility: 'MEMBERS_ONLY',
        branch: { isActive: true },
      },
      include: {
        branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true } },
        merchant: { select: { id: true, name: true } },
        limits: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    // Flash deals
    prisma.offer.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        offerType: 'FLASH',
        endAt: { gt: now },
        branch: { isActive: true },
      },
      include: {
        branch: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true } },
        limits: true,
      },
      orderBy: { endAt: 'asc' },
      take: 4,
    }),
    // Total active count
    prisma.offer.count({
      where: { lifecycleStatus: 'ACTIVE', approvalStatus: 'APPROVED' },
    }),
    // Demand count
    prisma.demandRequest.count({
      where: { status: { in: ['OPEN', 'COLLECTING'] } },
    }),
    // Active places count
    prisma.place.count({
      where: { isActive: true },
    }),
    // Featured collections (graceful fallback if model not yet available)
    (prisma.collection?.findMany({
      where: { isActive: true, isFeatured: true },
      include: { items: { select: { id: true } } },
      orderBy: { sortOrder: 'asc' },
      take: 10,
    }) ?? Promise.resolve([])).catch(() => []),
    // Active bundles
    (prisma.bundle?.findMany({
      where: {
        status: 'ACTIVE',
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      },
      include: {
        items: {
          include: {
            place: { select: { id: true, title: true, address: true, city: true } },
            merchant: { select: { id: true, name: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }) ?? Promise.resolve([])).catch(() => []),
    // Seasonal collections
    getSeasonalCollections().catch(() => [] as SeasonalCollection[]),
    // Deal of the Day — most redeemed today
    prisma.offer.findFirst({
      where: {
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
        branch: { isActive: true },
      },
      include: {
        branch: { select: { id: true, title: true, address: true, city: true } },
        merchant: { select: { id: true, name: true } },
        _count: {
          select: {
            redemptions: {
              where: { redeemedAt: { gte: startOfToday } },
            },
          },
        },
      },
      orderBy: { redemptions: { _count: 'desc' } },
    }).catch(() => null),
    // Curated collections (always present, dynamically populated)
    getCuratedCollections().catch(() => [] as CuratedCollection[]),
  ])

  return {
    freeOffers,
    memberOffers,
    flashOffers,
    allActive,
    demandCount,
    placeCount,
    collections: (collections ?? []) as Array<{ id: string; slug: string; title: string; description: string | null; coverUrl: string | null; items: Array<{ id: string }> }>,
    activeBundles: activeBundles ?? [],
    dealOfTheDay: dealOfTheDay ?? null,
    seasonalCollections: seasonalCollections ?? [],
    curatedCollections: curatedCollections ?? [],
  }
}

function mapOfferToCard(offer: any) {
  return {
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle,
    offerType: offer.offerType,
    visibility: offer.visibility,
    benefitType: offer.benefitType,
    benefitValue: Number(offer.benefitValue),
    imageUrl: offer.imageUrl,
    branchName: offer.branch.title,
    branchAddress: offer.branch.address,
    expiresAt: offer.endAt?.toISOString(),
    isFlash: offer.offerType === 'FLASH',
    maxRedemptions: offer.limits?.totalLimit ?? null,
    branchLat: offer.branch?.lat ?? null,
    branchLng: offer.branch?.lng ?? null,
    metadata: offer.metadata,
  }
}

export default async function Home() {
  const { freeOffers, memberOffers, flashOffers, allActive, demandCount, placeCount, collections, activeBundles, dealOfTheDay, seasonalCollections, curatedCollections } = await getHomeData()

  return (
    <main className="ec-page min-h-screen">
      <section className="border-b ec-line px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs ec-muted">поиск предложений рядом</p>
              <h1 className="mt-1 max-w-xl text-2xl md:text-3xl font-semibold tracking-[-0.045em] leading-tight text-[color:var(--ec-text)]">
                Найдите выгодное место без купонного шума
              </h1>
              <p className="mt-2 max-w-xl text-sm ec-muted">
                Сравниваем расстояние, выгоду, рейтинг, условия и время действия.
              </p>
            </div>
            <div className="hidden md:block">
              <HomeCityBadge allActive={allActive} />
            </div>
          </div>

          <div className="mt-4 max-w-xl">
            <Link
              href="/offers"
              className="ec-field flex h-12 items-center gap-3 px-4 text-base ec-muted transition-colors hover:bg-[color:var(--ec-surface)]"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              кофе, ужин, маникюр рядом
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 max-w-xl">
            <div className="ec-kpi">
              <b className="text-lg">{placeCount}</b>
              <span className="block text-[11px] ec-muted">{plural(placeCount, 'место', 'места', 'мест')}</span>
            </div>
            <div className="ec-kpi">
              <b className="text-lg">{allActive}</b>
              <span className="block text-[11px] ec-muted">{plural(allActive, 'скидка', 'скидки', 'скидок')}</span>
            </div>
            <div className="ec-kpi">
              <b className="text-lg">{demandCount}</b>
              <span className="block text-[11px] ec-muted">{plural(demandCount, 'запрос', 'запроса', 'запросов')}</span>
            </div>
          </div>

          <div className="mt-4 max-w-xl">
            <SavingsCounter variant="hero" />
          </div>
        </div>
      </section>

      {/* Deal of the Day — top featured offer */}
      {dealOfTheDay && (
        <DealOfTheDay
          id={dealOfTheDay.id}
          title={dealOfTheDay.title}
          merchantName={dealOfTheDay.merchant.name}
          branchName={dealOfTheDay.branch.title}
          imageUrl={dealOfTheDay.imageUrl}
          benefitType={dealOfTheDay.benefitType}
          benefitValue={Number(dealOfTheDay.benefitValue)}
          redemptionsTodayCount={dealOfTheDay._count.redemptions}
        />
      )}

      {/* Categories — horizontal scroll with emojis */}
      <section className="py-4 px-4 border-b ec-line">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 md:flex-wrap md:overflow-visible">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug === 'tourist' ? '/tourist' : `/offers?category=${cat.slug}`}
                className="ec-chip flex items-center gap-2 px-3 py-2 rounded-full shrink-0 transition-opacity hover:opacity-80"
              >
                <span className="text-sm text-[color:var(--ec-text)] font-medium whitespace-nowrap">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — 3-step explainer */}
      <section className="py-5 px-4 border-b ec-line">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-semibold text-[color:var(--ec-text)] mb-4">Как это работает</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-semibold text-[color:var(--ec-text)]">Найдите</p>
              <p className="text-xs ec-muted mt-1">по месту, цене и времени</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--ec-text)]">Покажите QR</p>
              <p className="text-xs ec-muted mt-1">кассиру до оплаты</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--ec-text)]">Сэкономьте</p>
              <p className="text-xs ec-muted mt-1">с подтверждением</p>
            </div>
          </div>
        </div>
      </section>

      {/* Near You — critical differentiator */}
      <NearYouSection />

      {/* Stories bar */}
      <HomeStoriesBar />

      {/* Personalized / Trending section */}
      <ForYouSection />

      {/* Curated local collections */}
      {curatedCollections.length > 0 && (
        <section className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="text-lg">&#x1F4DA;</span>
                Подборки
              </h2>
              <Link href="/offers" className="text-sm text-brand-600 font-medium hover:underline">
                Все &rarr;
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {curatedCollections.map((col: CuratedCollection) => (
                <CollectionCard
                  key={col.slug}
                  slug={col.slug}
                  title={col.title}
                  description={col.description}
                  emoji={col.emoji}
                  itemCount={col.itemCount}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial collections from DB */}
      {collections.length > 0 && (
        <section className="py-6 px-4 border-y ec-line">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[color:var(--ec-text)] flex items-center gap-2">
                Редакционные подборки
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {collections.map((col: any) => (
                <CollectionCard
                  key={col.id}
                  slug={col.slug}
                  title={col.title}
                  description={col.description}
                  coverUrl={col.coverUrl}
                  itemCount={col.items.length}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Seasonal Collections */}
      {seasonalCollections.length > 0 && (
        <section className="py-6 px-4 border-y ec-line">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-[color:var(--ec-text)]">Сезонные подборки</h2>
            </div>
            <div className="space-y-6">
              {seasonalCollections.map((col: SeasonalCollection) => (
                <div key={col.slug}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[color:var(--ec-text)] text-sm">{col.title}</h3>
                      <p className="text-xs ec-muted mt-0.5">{col.description}</p>
                    </div>
                    <span className="text-xs ec-muted shrink-0">{col.offers.length} предложений</span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                    {col.offers.map((offer) => (
                      <div key={offer.id} className="w-[240px] shrink-0">
                        <OfferCard {...offer} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Flash Deals */}
      {flashOffers.length > 0 && (
        <section className="py-6 px-4 border-y ec-line">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[color:var(--ec-text)]">Flash-скидки</h2>
                <span className="ec-chip text-xs px-2 py-0.5 rounded-full font-medium badge">
                  Ограничено
                </span>
              </div>
              <Link href="/offers?type=flash" className="text-sm text-brand-600 font-medium hover:underline">
                Все &rarr;
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {flashOffers.map((offer) => (
                <div key={offer.id} className="w-[260px] shrink-0">
                  <OfferCard {...mapOfferToCard(offer)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bundles — cross-merchant combos */}
      {activeBundles.length > 0 && (
        <section className="py-6 px-4 border-y ec-line">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[color:var(--ec-text)]">Комбо</h2>
                <span className="ec-chip text-xs px-2 py-0.5 rounded-full font-medium badge">
                  Несколько заведений
                </span>
              </div>
              <Link href="/bundles" className="text-sm text-brand-600 font-medium hover:underline">
                Все &rarr;
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {activeBundles.map((bundle: any) => (
                <div key={bundle.id} className="w-[280px] shrink-0">
                  <BundleCard
                    id={bundle.id}
                    title={bundle.title}
                    subtitle={bundle.subtitle}
                    imageUrl={bundle.imageUrl}
                    totalPrice={bundle.totalPrice}
                    discountPercent={bundle.discountPercent}
                    items={bundle.items}
                    validUntil={bundle.validUntil?.toISOString()}
                    redemptionCount={bundle._count.redemptions}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Free Deals — only show when we have enough offers to avoid repeating the same cards */}
      {freeOffers.length > 0 && allActive >= 15 && (
        <section className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <h2 className="font-bold text-gray-900">Бесплатные предложения</h2>
              </div>
              <Link href="/offers?visibility=FREE_FOR_ALL" className="text-sm text-brand-600 font-medium hover:underline">
                Все &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeOffers.slice(0, 6).map((offer) => (
                <OfferCard key={offer.id} {...mapOfferToCard(offer)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Members-only Deals */}
      {memberOffers.length > 0 && (
        <section className="py-6 px-4 border-y ec-line">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[color:var(--ec-text)]">Для подписчиков</h2>
                <span className="ec-chip text-xs px-2 py-0.5 rounded-full font-medium badge">
                  Plus
                </span>
              </div>
              <Link href="/offers?visibility=MEMBERS_ONLY" className="text-sm text-brand-600 font-medium hover:underline">
                Все &rarr;
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {memberOffers.slice(0, Math.max(1, memberOffers.length - 1)).map((offer) => (
                <div key={offer.id} className="w-[260px] shrink-0">
                  <OfferCard {...mapOfferToCard(offer)} />
                </div>
              ))}
              {/* Desire-gap: blurred locked card with subscription CTA */}
              {memberOffers.length > 1 && (
                <div className="w-[260px] shrink-0 relative">
                  <div className="blur-[3px] opacity-60 pointer-events-none select-none">
                    <OfferCard {...mapOfferToCard(memberOffers[memberOffers.length - 1])} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/subscription"
                      className="ec-surface rounded-xl px-5 py-4 text-center max-w-[220px] transition-opacity hover:opacity-90"
                    >
                      <p className="font-bold text-[color:var(--ec-text)] text-sm mb-1">
                        +{memberOffers.length} эксклюзивных скидок
                      </p>
                      <p className="text-xs ec-accent-text font-medium">
                        от 199₽/мес · 7 дней бесплатно
                      </p>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Demand CTA — "Хочу скидку" */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="ec-panel p-5">
            <h2 className="text-lg font-semibold text-[color:var(--ec-text)] mb-2">Нет скидки? Запросите</h2>
            <p className="ec-muted text-sm mb-4">
              Нажмите «Хочу скидку» на странице заведения — когда наберётся достаточно запросов, мы договоримся о скидке
            </p>
            {demandCount > 0 && (
              <p className="text-xs ec-muted mb-3">
                {demandCount} {demandCount === 1 ? 'активный запрос' : demandCount < 5 ? 'активных запроса' : 'активных запросов'} от пользователей
              </p>
            )}
            <Link
              href="/offers"
              className="ec-button inline-block px-5 py-2.5 text-sm transition-opacity hover:opacity-90"
            >
              Смотреть заведения
            </Link>
          </div>
        </div>
      </section>

      {/* Business + Subscription CTAs — compact side by side */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
          <div className="ec-panel p-5">
            <h2 className="text-lg font-semibold text-[color:var(--ec-text)] mb-2">Для бизнеса</h2>
            <p className="ec-muted text-sm mb-4">
              Привлекайте новых клиентов через скидки и отслеживайте результаты
            </p>
            <Link
              href="/business/register"
              className="ec-button inline-block px-5 py-2.5 text-sm transition-opacity hover:opacity-90"
            >
              Подключить заведение
            </Link>
          </div>
          <div className="ec-panel p-5">
            <h2 className="text-lg font-semibold text-[color:var(--ec-text)] mb-2">Подписка Plus</h2>
            <p className="ec-muted text-sm mb-4">
              Эксклюзивные скидки от лучших заведений. 7 дней бесплатно.
            </p>
            <Link
              href="/subscription"
              className="ec-button inline-block px-5 py-2.5 text-sm transition-opacity hover:opacity-90"
            >
              Попробовать бесплатно
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
