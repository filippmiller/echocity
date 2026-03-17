import { prisma } from '@/lib/prisma'
import { BundleCard } from '@/components/BundleCard'
import Link from 'next/link'

async function getBundles() {
  const now = new Date()

  const bundles = await prisma.bundle.findMany({
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
    take: 50,
  })

  return bundles
}

export default async function BundlesPage() {
  const bundles = await getBundles()

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white pt-6 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-indigo-100 mb-4">
            <span className="text-base">&#x1F381;</span>
            Выгоднее вместе
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            Комбо-предложения
          </h1>
          <p className="text-indigo-100 text-sm md:text-base max-w-lg mx-auto">
            Выгодные наборы от нескольких заведений. Одно предложение — несколько мест.
          </p>
        </div>
      </section>

      {/* Bundles grid */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          {bundles.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">&#x1F4E6;</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Комбо пока нет</h2>
              <p className="text-gray-500 mb-6">
                Скоро здесь появятся выгодные предложения от нескольких заведений
              </p>
              <Link href="/offers" className="text-brand-600 font-medium hover:underline">
                Смотреть скидки &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
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
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
