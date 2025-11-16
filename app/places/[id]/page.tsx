import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PlaceCard from '@/components/PlaceCard'
import ReviewsSection from '@/components/ReviewsSection'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlacePage({ params }: PageProps) {
  const { id } = await params
  const place = await prisma.place.findUnique({
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
          { isSpecial: 'desc' }, // Specials first
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
  })

  if (!place || !place.isActive || (!place.isPublished && !place.isApproved)) {
    notFound()
  }

  // Calculate average rating
  const publishedReviews = place.reviews.filter(
    (r) => r.isPublished && !r.isDeleted
  )
  const averageRating =
    publishedReviews.length > 0
      ? publishedReviews.reduce((sum, r) => sum + r.rating, 0) /
        publishedReviews.length
      : null

  // Format reviews for ReviewsSection component
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

  // Transform services to match PlaceCard expected format
  const transformedPlace = {
    ...place,
    services: place.services.map((s) => ({
      ...s,
      specialValidUntil: s.specialValidUntil?.toISOString() || null,
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlaceCard
          place={transformedPlace}
          averageRating={averageRating}
          reviewCount={place._count.reviews}
        />
        <ReviewsSection placeId={place.id} initialReviews={formattedReviews} />
      </div>
    </div>
  )
}

