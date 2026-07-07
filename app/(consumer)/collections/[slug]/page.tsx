export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { OfferCard } from '@/components/OfferCard'
import { getCuratedCollectionBySlug, CURATED_COLLECTIONS } from '@/modules/collections/curated'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params

  const isCurated = Object.values(CURATED_COLLECTIONS).some((c) => c.slug === slug)

  let title: string
  let description: string | null = null
  let items: Array<{ type: 'offer' | 'place' | 'unknown'; data: any }> = []

  if (isCurated) {
    try {
      const curated = await getCuratedCollectionBySlug(slug)
      title = curated.title
      description = curated.description
      items = curated.items as any[]
    } catch {
      notFound()
    }
  } else {
    const collection = await prisma.collection.findUnique({
      where: { slug, isActive: true },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!collection) notFound()

    title = collection.title
    description = collection.description

    // Populate items
    items = await Promise.all(
      collection.items.map(async (item) => {
        if (item.entityType === 'place') {
          const place = await prisma.place.findUnique({
            where: { id: item.entityId },
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              placeType: true,
            },
          })
          return { type: 'place' as const, data: place }
        }
        if (item.entityType === 'offer') {
          const offer = await prisma.offer.findUnique({
            where: { id: item.entityId },
            include: {
              branch: { select: { id: true, title: true, address: true, city: true } },
              merchant: { select: { id: true, name: true } },
              limits: true,
            },
          })
          return { type: 'offer' as const, data: offer }
        }
        return { type: 'unknown' as const, data: null }
      })
    )
  }

  const validItems = items.filter((i) => i.data)
  const emptyStateText =
    slug === CURATED_COLLECTIONS.coffee.slug
      ? 'Рядом пока нет кофейных предложений. Сохраните эту подборку — мы добавим новые заведения.'
      : slug === CURATED_COLLECTIONS.lunch.slug
        ? 'Сейчас нет обедов до 500 ₽. Попробуйте отфильтровать по категории «Еда» или запросите скидку.'
        : slug === CURATED_COLLECTIONS.evening.slug
          ? 'На сегодня нет вечерних предложений. Загляните позже или посмотрите все скидки.'
          : 'В этой подборке пока нет предложений. Вернитесь позже — мы обновляем подборки каждый день.'

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-blue-200 text-sm hover:underline mb-2 inline-block">
            &larr; На главную
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-blue-100 mt-2">{description}</p>
          )}
        </div>
      </section>

      {/* Items */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          {validItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {validItems.map((item) => {
                if (item.type === 'offer' && item.data) {
                  const offer = item.data as any
                  return (
                    <OfferCard
                      key={offer.id}
                      id={offer.id}
                      title={offer.title}
                      subtitle={offer.subtitle}
                      offerType={offer.offerType}
                      visibility={offer.visibility}
                      benefitType={offer.benefitType}
                      benefitValue={Number(offer.benefitValue)}
                      imageUrl={offer.imageUrl}
                      branchName={offer.branch?.title ?? ''}
                      branchAddress={offer.branch?.address ?? ''}
                      expiresAt={offer.endAt?.toISOString()}
                      isFlash={offer.offerType === 'FLASH'}
                      maxRedemptions={offer.limits?.totalLimit ?? null}
                    />
                  )
                }
                if (item.type === 'place' && item.data) {
                  const place = item.data as any
                  return (
                    <Link key={place.id} href={`/places/${place.id}`} className="block group">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                        <div className="relative aspect-[16/10] bg-gray-100">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <span className="text-4xl text-gray-300">&#x1F3E0;</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-brand-600">
                            {place.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">{place.address}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{place.city}</p>
                        </div>
                      </div>
                    </Link>
                  )
                }
                return null
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Пока ничего не нашлось</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-6">{emptyStateText}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/offers"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Смотреть все скидки
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  На главную
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
