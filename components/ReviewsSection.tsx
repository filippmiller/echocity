'use client'

import { useState, useEffect } from 'react'
import { Star, Calendar } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import ReviewForm from './ReviewForm'

interface Review {
  id: string
  rating: number
  title?: string | null
  body: string
  visitDate?: string | null
  createdAt: string | Date
  authorName: string
}

interface ReviewsSectionProps {
  placeId: string
  initialReviews: Review[]
}

export default function ReviewsSection({
  placeId,
  initialReviews,
}: ReviewsSectionProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/public/places/${placeId}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmitted = () => {
    setShowForm(false)
    loadReviews()
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Отзывы ({reviews.length})
        </h2>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            {showForm ? 'Отмена' : 'Написать отзыв'}
          </button>
        )}
      </div>

      {user && showForm && (
        <div className="mb-6 pb-6 border-b">
          <ReviewForm placeId={placeId} onSubmitted={handleReviewSubmitted} />
        </div>
      )}

      {!user && (
        <p className="text-sm text-gray-600 mb-6">
          <a href="/auth/login" className="text-blue-600 hover:text-blue-700">
            Войдите
          </a>
          , чтобы оставить отзыв
        </p>
      )}

      {loading ? (
        <p className="text-gray-600">Загрузка отзывов...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-600">Пока нет отзывов. Будьте первым!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {review.authorName}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt as string).toLocaleDateString('ru-RU')}
                </span>
              </div>

              {review.title && (
                <h3 className="font-semibold text-gray-900 mb-2">
                  {review.title}
                </h3>
              )}

              <p className="text-gray-700 mb-2 whitespace-pre-wrap">
                {review.body}
              </p>

              {review.visitDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Посещено:{' '}
                    {new Date(review.visitDate).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

