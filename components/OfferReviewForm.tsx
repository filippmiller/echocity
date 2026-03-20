'use client'

import { useState, useRef } from 'react'
import { Star, Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OfferReviewFormProps {
  offerId: string
  redemptionId: string
  onSubmitted: () => void
  onCancel: () => void
}

const MAX_PHOTOS = 3

export default function OfferReviewForm({
  offerId,
  redemptionId,
  onSubmitted,
  onCancel,
}: OfferReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<{ file: File; preview: string; uploading: boolean; url: string | null }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const available = MAX_PHOTOS - photos.length
    const toAdd = files.slice(0, available)

    // Add previews immediately
    const newPhotos = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      url: null as string | null,
    }))
    setPhotos((prev) => [...prev, ...newPhotos])

    // Upload each photo
    for (let i = 0; i < toAdd.length; i++) {
      const file = toAdd[i]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/reviews/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Ошибка загрузки фото')
          setPhotos((prev) =>
            prev.filter((p) => p.preview !== newPhotos[i].preview)
          )
        } else {
          setPhotos((prev) =>
            prev.map((p) =>
              p.preview === newPhotos[i].preview
                ? { ...p, uploading: false, url: data.url }
                : p
            )
          )
        }
      } catch {
        toast.error('Ошибка сети при загрузке фото')
        setPhotos((prev) =>
          prev.filter((p) => p.preview !== newPhotos[i].preview)
        )
      }
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (preview: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.preview === preview)
      if (photo) URL.revokeObjectURL(photo.preview)
      return prev.filter((p) => p.preview !== preview)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating < 1 || rating > 5) {
      setError('Выберите оценку от 1 до 5')
      return
    }

    // Check if any photo is still uploading
    if (photos.some((p) => p.uploading)) {
      setError('Дождитесь завершения загрузки фото')
      return
    }

    const photoUrls = photos.filter((p) => p.url).map((p) => p.url as string)

    setSubmitting(true)
    try {
      const res = await fetch(`/api/offers/${offerId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redemptionId,
          rating,
          comment: comment.trim() || undefined,
          photoUrls,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Не удалось отправить отзыв')
        return
      }

      onSubmitted()
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Ваш отзыв</h3>

      {/* Star picker */}
      <div>
        <label className="block text-sm text-gray-600 mb-1.5">Оценка</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              {rating === 1 && 'Плохо'}
              {rating === 2 && 'Ниже среднего'}
              {rating === 3 && 'Нормально'}
              {rating === 4 && 'Хорошо'}
              {rating === 5 && 'Отлично'}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="block text-sm text-gray-600 mb-1.5">
          Комментарий <span className="text-gray-400">(необязательно)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Расскажите о вашем опыте..."
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
        />
        {comment.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">{comment.length}/1000</p>
        )}
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm text-gray-600 mb-1.5">
          Фотографии <span className="text-gray-400">(до {MAX_PHOTOS} фото)</span>
        </label>

        <div className="flex items-start gap-2 flex-wrap">
          {/* Photo thumbnails */}
          {photos.map((photo) => (
            <div key={photo.preview} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview}
                alt="Фото отзыва"
                className="w-full h-full object-cover"
              />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {!photo.uploading && (
                <button
                  type="button"
                  onClick={() => removePhoto(photo.preview)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-gray-900/70 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                  aria-label="Удалить фото"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Add photo button */}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors flex-shrink-0"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[10px] leading-tight text-center">Добавить фото</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || rating < 1 || photos.some((p) => p.uploading)}
          className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Отправка...' : 'Отправить отзыв'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}
