import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { OfferCard } from '@/components/OfferCard'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params

  const collection = await prisma.collection.findUnique({
    where: { slug, isActive: true },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!collection) notFound()

  // Populate items
  const items = await Promise.all(
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

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-blue-200 text-sm hover:underline mb-2 inline-block">
            &larr; На главную
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{collection.title}</h1>
          {collection.description && (
            <p className="text-blue-100 mt-2">{collection.description}</p>
          )}
        </div>
      </section>

      {/* Items */}
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => {
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

          {items.filter((i) => i.data).length === 0 && (
            <p className="text-gray-500 text-center py-12">Подборка пока пуста</p>
          )}
        </div>
      </section>
    </main>
  )
}
