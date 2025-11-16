'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Place {
  id: string
  title: string
  city: string
  address: string
}

interface Review {
  id: string
  rating: number
  title?: string
  body: string
  visitDate?: string
  createdAt: string
  authorName: string
}

export default function ReviewsTestPage() {
  const params = useParams()
  const placeId = params.placeId as string

  const [place, setPlace] = useState<Place | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    body: '',
    visitDate: '',
  })

  useEffect(() => {
    loadPlace()
    loadReviews()
  }, [placeId])

  const loadPlace = async () => {
    try {
      const res = await fetch(`/api/public/places/${placeId}`)
      if (res.ok) {
        const data = await res.json()
        setPlace(data.place)
      } else {
        setError('Место не найдено')
      }
    } catch (err) {
      setError('Ошибка при загрузке информации о месте')
    }
  }

  const loadReviews = async () => {
    try {
      const res = await fetch(`/api/public/places/${placeId}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (err) {
      setError('Ошибка при загрузке отзывов')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)

    try {
      const payload: any = {
        rating: formData.rating,
        body: formData.body,
      }

      if (formData.title) payload.title = formData.title
      if (formData.visitDate) payload.visitDate = new Date(formData.visitDate).toISOString()

      const res = await fetch(`/api/places/${placeId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка при отправке отзыва')
        return
      }

      setSuccess(true)
      setFormData({
        rating: 5,
        title: '',
        body: '',
        visitDate: '',
      })

      // Reload reviews
      loadReviews()
    } catch (err) {
      setError('Ошибка при отправке отзыва')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Тестовая страница отзывов
        </h1>

        {place && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{place.title}</h2>
            <p className="text-gray-600">
              {place.city}, {place.address}
            </p>
            <p className="text-sm text-gray-500 mt-2">ID: {place.id}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Оставить отзыв</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Рейтинг *
              </label>
              <select
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: parseInt(e.target.value) })
                }
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={5}>5 - Отлично</option>
                <option value={4}>4 - Хорошо</option>
                <option value={3}>3 - Нормально</option>
                <option value={2}>2 - Плохо</option>
                <option value={1}>1 - Ужасно</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок (опционально)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Краткий заголовок отзыва"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текст отзыва * (минимум 10 символов)
              </label>
              <textarea
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                required
                rows={5}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Опишите ваш опыт..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата визита (опционально)
              </label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) =>
                  setFormData({ ...formData, visitDate: e.target.value })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                Отзыв успешно отправлен!
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || formData.body.length < 10}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Отзывы ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500">Пока нет отзывов</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {review.authorName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        {review.visitDate &&
                          ` • Посещение: ${new Date(review.visitDate).toLocaleDateString('ru-RU')}`}
                      </p>
                    </div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  {review.title && (
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {review.title}
                    </h3>
                  )}
                  <p className="text-gray-700">{review.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

