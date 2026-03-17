export const dynamic = 'force-dynamic'

import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { OfferCard } from "@/components/OfferCard"
import { BundleCard } from "@/components/BundleCard"
import { Footer } from "@/components/Footer"
import { SavingsCounter } from "@/components/SavingsCounter"
import { CollectionCard } from "@/components/CollectionCard"
import { HomeStoriesBar } from "@/components/HomeStoriesBar"
import { ForYouSection } from "@/components/ForYouSection"

const CATEGORIES = [
  { name: 'Кофе', slug: 'coffee', emoji: '☕', types: ['CAFE'] },
  { name: 'Еда', slug: 'food', emoji: '🍔', types: ['RESTAURANT'] },
  { name: 'Бары', slug: 'bars', emoji: '🍺', types: ['BAR'] },
  { name: 'Красота', slug: 'beauty', emoji: '💅', types: ['BEAUTY', 'NAILS', 'HAIR'] },
  { name: 'Услуги', slug: 'services', emoji: '🔧', types: ['DRYCLEANING', 'OTHER'] },
  { name: 'Развлечения', slug: 'entertainment', emoji: '🎭', types: [] },
  { name: 'Магазины', slug: 'shops', emoji: '🛍', types: [] },
  { name: 'Туристам', slug: 'tourist', emoji: '🌍', types: [] },
]

async function getHomeData() {
  const now = new Date()

  const [freeOffers, memberOffers, flashOffers, allActive, demandCount, placeCount, collections, activeBundles] = await Promise.all([
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
  ])

  return { freeOffers, memberOffers, flashOffers, allActive, demandCount, placeCount, collections: collections ?? [], activeBundles: activeBundles ?? [] }
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
  }
}

export default async function Home() {
  const { freeOffers, memberOffers, flashOffers, allActive, demandCount, placeCount, collections, activeBundles } = await getHomeData()

  return (
    <main className="min-h-screen bg-white">
      {/* Hero — compact, punchy */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 text-white pt-4 pb-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-blue-100 mb-4">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Санкт-Петербург &middot; {allActive} скидок
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            Скидки рядом с вами
          </h1>
          <p className="text-blue-100 text-sm md:text-base mb-5 max-w-lg mx-auto">
            Находите предложения, активируйте через QR и экономьте каждый день
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto mb-4">
            <Link
              href="/offers"
              className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 text-gray-500 text-sm hover:bg-white transition-colors shadow-lg"
            >
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Найти скидку, заведение...
            </Link>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-xs text-blue-200">
            <span><strong className="text-white">{placeCount}</strong> заведений</span>
            <span><strong className="text-white">{allActive}</strong> скидок</span>
            <span><strong className="text-white">{demandCount}</strong> запросов</span>
          </div>

          {/* Savings counter */}
          <div className="mt-4">
            <SavingsCounter variant="hero" />
          </div>
        </div>
      </section>

      {/* Stories bar */}
      <HomeStoriesBar />

      {/* Personalized / Trending section */}
      <ForYouSection />

      {/* Categories — horizontal scroll with emojis */}
      <section className="py-5 px-4 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug === 'tourist' ? '/tourist' : `/offers?category=${cat.slug}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-full hover:bg-gray-100 shrink-0 transition-colors"
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-sm text-gray-700 font-medium whitespace-nowrap">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      {collections.length > 0 && (
        <section className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="text-lg">&#x1F4DA;</span>
                Подборки
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

      {/* Flash Deals */}
      {flashOffers.length > 0 && (
        <section className="py-6 px-4 bg-gradient-to-r from-deal-flash/5 to-orange-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h2 className="font-bold text-gray-900">Flash-скидки</h2>
                <span className="text-xs bg-deal-flash text-white px-2 py-0.5 rounded-full font-medium animate-pulse badge">
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
        <section className="py-6 px-4 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">&#x1F381;</span>
                <h2 className="font-bold text-gray-900">Комбо</h2>
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium badge">
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

      {/* Free Deals — no subscription needed */}
      {freeOffers.length > 0 && (
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
        <section className="py-6 px-4 bg-gradient-to-r from-deal-premium/5 to-purple-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <h2 className="font-bold text-gray-900">Для подписчиков</h2>
                <span className="text-xs bg-deal-premium text-white px-2 py-0.5 rounded-full font-medium badge">
                  Plus
                </span>
              </div>
              <Link href="/offers?visibility=MEMBERS_ONLY" className="text-sm text-brand-600 font-medium hover:underline">
                Все &rarr;
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {memberOffers.map((offer) => (
                <div key={offer.id} className="w-[260px] shrink-0">
                  <OfferCard {...mapOfferToCard(offer)} />
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/subscription"
                className="inline-flex items-center gap-2 text-sm text-deal-premium font-medium hover:underline"
              >
                Подписка от 199₽/мес — попробуйте 7 дней бесплатно &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Demand CTA — "Хочу скидку" */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center">
            <h2 className="text-xl font-bold mb-2">Нет скидки? Запросите!</h2>
            <p className="text-amber-100 text-sm mb-4">
              Нажмите «Хочу скидку» на странице заведения — когда наберётся достаточно запросов, мы договоримся о скидке
            </p>
            {demandCount > 0 && (
              <p className="text-xs text-amber-200 mb-3">
                {demandCount} {demandCount === 1 ? 'активный запрос' : demandCount < 5 ? 'активных запроса' : 'активных запросов'} от пользователей
              </p>
            )}
            <Link
              href="/offers"
              className="inline-block px-6 py-2.5 bg-white text-orange-600 rounded-xl font-semibold text-sm hover:bg-orange-50 transition-colors"
            >
              Смотреть заведения
            </Link>
          </div>
        </div>
      </section>

      {/* Business + Subscription CTAs — compact side by side */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Для бизнеса</h2>
            <p className="text-gray-600 text-sm mb-4">
              Привлекайте новых клиентов через скидки и отслеживайте результаты
            </p>
            <Link
              href="/business/register"
              className="inline-block px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Подключить заведение
            </Link>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Подписка Plus</h2>
            <p className="text-gray-600 text-sm mb-4">
              Эксклюзивные скидки от лучших заведений. 7 дней бесплатно.
            </p>
            <Link
              href="/subscription"
              className="inline-block px-5 py-2.5 bg-deal-premium text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
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
