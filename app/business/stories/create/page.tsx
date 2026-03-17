'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'

interface Branch {
  id: string
  title: string
  address: string
}

interface OfferOption {
  id: string
  title: string
}

export default function CreateStoryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [branches, setBranches] = useState<Branch[]>([])
  const [offers, setOffers] = useState<OfferOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [branchId, setBranchId] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [linkOfferId, setLinkOfferId] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'BUSINESS_OWNER') return

    Promise.all([
      fetch('/api/business/places').then((r) => r.json()),
      fetch('/api/business/offers').then((r) => r.json()),
    ])
      .then(([placesData, offersData]) => {
        const allBranches: Branch[] = []
        for (const biz of placesData.businesses || []) {
          for (const place of biz.places || []) {
            allBranches.push({
              id: place.id,
              title: place.title,
              address: place.address,
            })
          }
        }
        setBranches(allBranches)
        if (allBranches.length > 0) setBranchId(allBranches[0].id)

        const allOffers: OfferOption[] = (offersData.offers || []).map((o: any) => ({
          id: o.id,
          title: o.title,
        }))
        setOffers(allOffers)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!branchId || !mediaUrl) {
      setError('Выберите точку и укажите ссылку на изображение')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/business/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          mediaUrl,
          caption: caption || undefined,
          linkOfferId: linkOfferId || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ошибка при создании')
        setSubmitting(false)
        return
      }

      router.push('/business/stories')
    } catch {
      setError('Ошибка сети')
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'BUSINESS_OWNER') {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          Доступ запрещён
        </div>
      </div>
    )
  }

  if (branches.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-600 mb-4">
            Сначала добавьте хотя бы одно заведение
          </p>
          <Link
            href="/business/places"
            className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Перейти к заведениям
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Новая история</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Branch select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Точка
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.address}
              </option>
            ))}
          </select>
        </div>

        {/* Media URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ссылка на изображение
          </label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Загрузите изображение в хранилище и вставьте ссылку
          </p>
        </div>

        {/* Preview */}
        {mediaUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200 aspect-[9/16] max-h-80 bg-gray-100">
            <img
              src={mediaUrl}
              alt="Preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Подпись
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Расскажите о вашей акции или событии..."
            rows={3}
            maxLength={500}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{caption.length}/500</p>
        </div>

        {/* Link to offer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Привязать к предложению (необязательно)
          </label>
          <select
            value={linkOfferId}
            onChange={(e) => setLinkOfferId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          >
            <option value="">Без привязки</option>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            При просмотре истории пользователь увидит кнопку «Смотреть предложение»
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            История будет видна пользователям 24 часа, после чего автоматически станет неактивной.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Публикация...' : 'Опубликовать историю'}
        </button>
      </form>
    </div>
  )
}
