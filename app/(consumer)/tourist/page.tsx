export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OfferCard } from '@/components/OfferCard'
import { Footer } from '@/components/Footer'

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
        },
      },
      merchant: { select: { id: true, name: true } },
      limits: true,
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
  }
}

export default async function TouristPage() {
  const offers = await getTouristOffers()

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

      {/* Quick navigation */}
      <section className="py-4 px-4 border-b border-gray-100 sticky top-14 z-30 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto hide-scrollbar">
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
        </div>
      </section>

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
