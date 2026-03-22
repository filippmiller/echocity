export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OfferCard } from '@/components/OfferCard'
import { Footer } from '@/components/Footer'

const TOURIST_CATEGORIES = [
  { slug: 'all', label: 'Все', labelEn: 'All', emoji: '🌍' },
  { slug: 'CAFE', label: 'Кофейни', labelEn: 'Coffee', emoji: '☕' },
  { slug: 'RESTAURANT', label: 'Рестораны', labelEn: 'Restaurants', emoji: '🍽️' },
  { slug: 'BAR', label: 'Бары', labelEn: 'Bars', emoji: '🍺' },
  { slug: 'BEAUTY', label: 'Красота', labelEn: 'Beauty', emoji: '💆' },
] as const

async function getTouristOffers(city: string = 'Санкт-Петербург') {
  const offers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      visibility: { in: ['PUBLIC', 'FREE_FOR_ALL'] },
      branch: {
        isActive: true,
        city,
      },
    },
    include: {
      branch: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          lat: true,
          lng: true,
          placeType: true,
          nearestMetro: true,
        },
      },
      merchant: { select: { id: true, name: true, isVerified: true } },
      limits: true,
      _count: { select: { redemptions: true } },
    },
    orderBy: { benefitValue: 'desc' },
    take: 60,
  })

  return offers
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
    nearestMetro: offer.branch?.nearestMetro ?? null,
    isVerified: offer.merchant?.isVerified ?? false,
    redemptionCount: offer._count?.redemptions ?? 0,
  }
}

export default async function TouristPage() {
  const offers = await getTouristOffers()

  // Top picks — best value offers (highest percentage or free items, max 3)
  const topPicks = [...offers]
    .sort((a, b) => {
      // Free items first, then by benefit value descending
      if (a.benefitType === 'FREE_ITEM' && b.benefitType !== 'FREE_ITEM') return -1
      if (b.benefitType === 'FREE_ITEM' && a.benefitType !== 'FREE_ITEM') return 1
      return Number(b.benefitValue) - Number(a.benefitValue)
    })
    .slice(0, 3)

  // Group by benefit type for display sections
  const percentOffers = offers.filter((o) => o.benefitType === 'PERCENT')
  const freeItemOffers = offers.filter((o) => o.benefitType === 'FREE_ITEM')
  const fixedOffers = offers.filter(
    (o) => o.benefitType === 'FIXED_AMOUNT' || o.benefitType === 'FIXED_PRICE',
  )
  const otherOffers = offers.filter(
    (o) =>
      o.benefitType !== 'PERCENT' &&
      o.benefitType !== 'FREE_ITEM' &&
      o.benefitType !== 'FIXED_AMOUNT' &&
      o.benefitType !== 'FIXED_PRICE',
  )

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-700 text-white pt-6 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-teal-100 mb-4">
            <span className="text-lg">&#x1F30D;</span>
            Режим туриста
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Режим туриста
          </h1>
          <p className="text-teal-100 text-base md:text-lg mb-2 max-w-lg mx-auto">
            Лучшие предложения для гостей города
          </p>
          <p className="text-teal-200 text-sm max-w-md mx-auto">
            Без подписки, без регистрации — просто покажите QR-код на кассе и получите скидку
          </p>

          <div className="mt-6 flex justify-center gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">{offers.length}</div>
              <div className="text-teal-200 text-xs">предложений</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">0&#x20BD;</div>
              <div className="text-teal-200 text-xs">подписка</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">QR</div>
              <div className="text-teal-200 text-xs">активация</div>
            </div>
          </div>
        </div>
      </section>

      {/* Language hint */}
      <section className="bg-blue-50 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-3 text-xs text-blue-600">
          <span>🇷🇺 Русский</span>
          <span className="text-blue-300">|</span>
          <span className="text-blue-400">🇬🇧 English version coming soon</span>
        </div>
      </section>

      {/* Quick navigation + category filter */}
      <section className="py-4 px-4 border-b border-gray-100 sticky top-14 z-30 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <Link
              href="/offers"
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full hover:bg-gray-100 shrink-0 transition-colors text-sm text-gray-700 font-medium"
            >
              <span>&#x1F50D;</span>
              Все скидки
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full hover:bg-gray-100 shrink-0 transition-colors text-sm text-gray-700 font-medium"
            >
              <span>&#x1F5FA;&#xFE0F;</span>
              На карте
            </Link>
            <Link
              href="/offers?visibility=FREE_FOR_ALL"
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full hover:bg-gray-100 shrink-0 transition-colors text-sm text-gray-700 font-medium"
            >
              <span>&#x1F381;</span>
              Бесплатные
            </Link>
            <Link
              href="/roulette"
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full hover:bg-purple-100 shrink-0 transition-colors text-sm text-purple-700 font-medium"
            >
              <span>🎰</span>
              Рулетка
            </Link>
          </div>
          {/* Tourist category pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {TOURIST_CATEGORIES.map((cat) => (
              <span
                key={cat.slug}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 rounded-full text-xs text-teal-700 font-medium whitespace-nowrap border border-teal-100"
              >
                {cat.emoji} {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Popular with tourists — most redeemed */}
      {(() => {
        const popular = [...offers].sort((a: any, b: any) => (b._count?.redemptions ?? 0) - (a._count?.redemptions ?? 0)).slice(0, 6)
        if (popular.length === 0) return null
        return (
          <section className="py-6 px-4 bg-teal-50">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔥</span>
                <h2 className="font-bold text-gray-900 text-lg">Популярно у туристов</h2>
                <span className="text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full font-medium">
                  по использованиям
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {popular.map((offer) => (
                  <OfferCard key={`pop-${offer.id}`} {...mapOfferToCard(offer)} />
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Top Picks — hero section */}
      {topPicks.length > 0 && (
        <section className="py-6 px-4 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⭐</span>
              <h2 className="font-bold text-gray-900 text-lg">Выбор редакции</h2>
              <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-medium">
                TOP {topPicks.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topPicks.map((offer) => (
                <OfferCard key={`top-${offer.id}`} {...mapOfferToCard(offer)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Percent discounts */}
      {percentOffers.length > 0 && (
        <section className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">&#x1F525;</span>
              <h2 className="font-bold text-gray-900 text-lg">Лучшие скидки</h2>
              <span className="text-xs bg-deal-discount text-white px-2 py-0.5 rounded-full font-medium">
                %
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {percentOffers.map((offer) => (
                <OfferCard key={offer.id} {...mapOfferToCard(offer)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Free items */}
      {freeItemOffers.length > 0 && (
        <section className="py-6 px-4 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">&#x1F381;</span>
              <h2 className="font-bold text-gray-900 text-lg">Бесплатные позиции</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeItemOffers.map((offer) => (
                <OfferCard key={offer.id} {...mapOfferToCard(offer)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fixed amount / fixed price discounts */}
      {fixedOffers.length > 0 && (
        <section className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">&#x1F4B0;</span>
              <h2 className="font-bold text-gray-900 text-lg">Фиксированные скидки</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedOffers.map((offer) => (
                <OfferCard key={offer.id} {...mapOfferToCard(offer)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other offers */}
      {otherOffers.length > 0 && (
        <section className="py-6 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">&#x2B50;</span>
              <h2 className="font-bold text-gray-900 text-lg">Другие предложения</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherOffers.map((offer) => (
                <OfferCard key={offer.id} {...mapOfferToCard(offer)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {offers.length === 0 && (
        <section className="py-16 px-4 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-5xl mb-4">&#x1F30D;</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Пока нет предложений для туристов
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Скоро здесь появятся лучшие скидки для гостей города. Загляните позже!
            </p>
            <Link
              href="/offers"
              className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors"
            >
              Смотреть все скидки
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
            <h2 className="text-xl font-bold mb-2">Хотите больше скидок?</h2>
            <p className="text-teal-100 text-sm mb-4">
              Подписка Plus открывает эксклюзивные предложения от лучших заведений города
            </p>
            <Link
              href="/subscription"
              className="inline-block px-6 py-2.5 bg-white text-teal-600 rounded-xl font-semibold text-sm hover:bg-teal-50 transition-colors"
            >
              Попробовать 7 дней бесплатно
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
