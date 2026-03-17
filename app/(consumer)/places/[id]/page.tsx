export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PlaceCard from '@/components/PlaceCard'
import ReviewsSection from '@/components/ReviewsSection'
import { OfferCard } from '@/components/OfferCard'
import { DemandButton } from '@/components/DemandButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlacePage({ params }: PageProps) {
  const { id } = await params
  const [place, offers, demandRequests] = await Promise.all([
    prisma.place.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            website: true,
            supportPhone: true,
            supportEmail: true,
          },
        },
        services: {
          where: { isActive: true },
          include: {
            serviceType: {
              include: {
                category: true,
              },
            },
          },
          orderBy: [
            { isSpecial: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        reviews: {
          where: {
            isPublished: true,
            isDeleted: false,
          },
          include: {
            user: {
              select: {
                email: true,
                profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            reviews: {
              where: {
                isPublished: true,
                isDeleted: false,
              },
            },
          },
        },
      },
    }),
    // Fetch active offers for this place
    prisma.offer.findMany({
      where: {
        branchId: id,
        lifecycleStatus: 'ACTIVE',
        approvalStatus: 'APPROVED',
      },
      include: {
        branch: { select: { id: true, title: true, address: true, city: true } },
        merchant: { select: { id: true, name: true } },
        limits: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    // Fetch demand requests for this place
    prisma.demandRequest.findMany({
      where: {
        placeId: id,
        status: { in: ['OPEN', 'COLLECTING'] },
      },
      select: { supportCount: true },
    }),
  ])

  if (!place || !place.isActive || (!place.isPublished && !place.isApproved)) {
    notFound()
  }

  const publishedReviews = place.reviews.filter(
    (r) => r.isPublished && !r.isDeleted
  )
  const averageRating =
    publishedReviews.length > 0
      ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) /
        publishedReviews.length
      : null

  const formattedReviews = place.reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    visitDate: review.visitDate?.toISOString() || null,
    createdAt: review.createdAt.toISOString(),
    authorName:
      review.user.profile?.fullName ||
      review.user.email.split('@')[0] ||
      'Анонимный пользователь',
  }))

  const transformedPlace = {
    ...place,
    services: place.services.map((s) => ({
      ...s,
      specialValidUntil: s.specialValidUntil?.toISOString() || null,
    })),
  }

  const totalDemand = demandRequests.reduce((sum, d) => sum + d.supportCount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlaceCard
          place={transformedPlace}
          averageRating={averageRating}
          reviewCount={place._count.reviews}
        />

        {/* Reservation button */}
        {(place.placeType === 'CAFE' || place.placeType === 'RESTAURANT' || place.placeType === 'BAR') && (
          <div className="mt-6">
            <Link
              href={`/places/${id}/reserve`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              Забронировать стол
            </Link>
          </div>
        )}

        {/* Offers section */}
        {offers.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-lg">🏷</span>
              Предложения
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => (
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
                  branchName={offer.branch.title}
                  branchAddress={offer.branch.address}
                  expiresAt={offer.endAt?.toISOString()}
                  isFlash={offer.offerType === 'FLASH'}
                  maxRedemptions={offer.limits?.totalLimit ?? null}
                />
              ))}
            </div>
          </section>
        )}

        {/* "Хочу скидку" demand section */}
        {offers.length === 0 && (
          <section className="mt-8">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center">
              <h2 className="text-xl font-bold mb-2">Здесь пока нет скидок</h2>
              <p className="text-amber-100 text-sm mb-4">
                Нажмите «Хочу скидку» — когда наберётся достаточно запросов, мы договоримся о скидке с заведением
              </p>
              {totalDemand > 0 && (
                <p className="text-xs text-amber-200 mb-3">
                  Уже {totalDemand} {totalDemand === 1 ? 'человек хочет' : totalDemand < 5 ? 'человека хотят' : 'человек хотят'} скидку здесь
                </p>
              )}
              <DemandButton placeId={id} />
            </div>
          </section>
        )}

        {/* Show demand count even when offers exist */}
        {offers.length > 0 && totalDemand > 0 && (
          <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            <span>🔥</span>
            {totalDemand} {totalDemand === 1 ? 'человек запросил' : 'человек запросили'} скидки здесь
          </div>
        )}

        <ReviewsSection placeId={place.id} initialReviews={formattedReviews} />
      </div>
    </div>
  )
}
