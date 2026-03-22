'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, BadgeCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import OfferReviewForm from './OfferReviewForm'

interface Review {
  id: string
  rating: number
  comment: string | null
  photoUrls: string[]
  createdAt: string
  authorName: string
  isVerifiedVisit?: boolean
}

interface UnreviewedRedemption {
  id: string
  redeemedAt: string
}

interface OfferReviewsProps {
  offerId: string
}

export default function OfferReviews({ offerId }: OfferReviewsProps) {
  const { user, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [unreviewedRedemptions, setUnreviewedRedemptions] = useState<UnreviewedRedemption[]>([])

  const loadReviews = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/offers/${offerId}/reviews?page=${p}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setTotal(data.total || 0)
        setAvgRating(data.avgRating)
        setReviewCount(data.reviewCount || 0)
      }
    } catch (error) {
      console.error('Error loading offer reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [offerId])

  useEffect(() => {
    loadReviews(page)
  }, [loadReviews, page])

  // Check for unreviewable redemptions when user is loaded
  useEffect(() => {
    if (!user || authLoading) return

    // Fetch user's successful redemptions for this offer that haven't been reviewed
    async function checkUnreviewed() {
      try {
        const res = await fetch(`/api/redemptions/mine?offerId=${offerId}&unreviewedOnly=1`)
        if (res.ok) {
          const data = await res.json()
          setUnreviewedRedemptions(data.redemptions || [])
        }
      } catch {
        // If the endpoint doesn't exist, just ignore
      }
    }
    checkUnreviewed()
  }, [user, authLoading, offerId])

  const handleReviewSubmitted = () => {
    setShowForm(false)
    setPage(1)
    loadReviews(1)
    // Remove the used redemption from the list
    setUnreviewedRedemptions((prev) => prev.slice(1))
  }

  const totalPages = Math.ceil(total / 10)

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header with average rating */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Отзывы{reviewCount > 0 ? ` (${reviewCount})` : ''}
          </h2>
          {avgRating !== null && (
            <div className="flex items-center gap-2 mt-1">
              {renderStars(Math.round(avgRating))}
              <span className="text-sm font-medium text-gray-700">{avgRating}</span>
              <span className="text-sm text-gray-400">из 5</span>
            </div>
          )}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Все отзывы от проверенных посетителей</span>
            </div>
          )}
        </div>

        {user && unreviewedRedemptions.length > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors"
          >
            Написать отзыв
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && unreviewedRedemptions.length > 0 && (
        <div className="mb-5 pb-5 border-b border-gray-100">
          <OfferReviewForm
            offerId={offerId}
            redemptionId={unreviewedRedemptions[0].id}
            onSubmitted={handleReviewSubmitted}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Login prompt */}
      {!authLoading && !user && (
        <p className="text-sm text-gray-500 mb-4">
          <a href="/auth/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Войдите
          </a>
          , чтобы оставить отзыв после использования предложения.
        </p>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="py-8 text-center text-gray-400">Загрузка отзывов...</div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          Пока нет отзывов. Будьте первым!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-gray-800">
                    {review.authorName}
                  </span>
                  {review.isVerifiedVisit && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-semibold">
                      <BadgeCheck className="w-3 h-3" />
                      Визит подтверждён
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {review.comment}
                </p>
              )}
              {review.photoUrls && review.photoUrls.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {review.photoUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 hover:opacity-90 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Фото ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
