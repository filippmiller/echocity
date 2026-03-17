'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'
import { MapPin, ChevronLeft, Calendar, Tag, CheckCircle2, Store } from 'lucide-react'
import { AuthPrompt } from '@/components/AuthPrompt'
import { useAuthPrompt } from '@/lib/useAuthPrompt'
import { toast } from 'sonner'

interface BundlePlace {
  id: string
  title: string
  address: string
  city: string
  lat?: number | null
  lng?: number | null
}

interface BundleItemDetail {
  id: string
  itemTitle: string
  itemValue: number | null
  sortOrder: number
  accepted: boolean
  place: BundlePlace
  merchant: { id: string; name: string }
  offer: { id: string; title: string; benefitType: string; benefitValue: number } | null
}

interface BundleDetail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  imageUrl: string | null
  totalPrice: number | null
  discountPercent: number | null
  visibility: string
  status: string
  validFrom: string
  validUntil: string | null
  items: BundleItemDetail[]
  city: { id: string; name: string } | null
  _count: { redemptions: number }
}

function formatPrice(kopecks: number): string {
  return Math.floor(kopecks / 100).toLocaleString('ru-RU') + ' \u20BD'
}

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bundle, setBundle] = useState<BundleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const { authPromptProps, showAuthPrompt } = useAuthPrompt()

  useEffect(() => {
    fetch(`/api/bundles/${id}`)
      .then((r) => r.json())
      .then((data) => { setBundle(data.bundle); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleRedeem = async () => {
    if (!user) {
      showAuthPrompt('Войдите, чтобы использовать комбо', `/bundles/${id}`)
      return
    }
    setRedeeming(true)
    try {
      const res = await fetch(`/api/bundles/${id}/redeem`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      toast.success('Комбо активировано! Покажите этот экран в заведении.')
    } catch (err: any) {
      toast.error(err.message || 'Не удалось активировать комбо')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!bundle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">&#x1F50D;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Комбо не найдено</h2>
        <p className="text-gray-500 mb-6">Возможно, оно было удалено или срок действия истёк</p>
        <Link href="/bundles" className="text-brand-600 font-medium hover:underline">
          Все комбо &rarr;
        </Link>
      </div>
    )
  }

  const isMembersOnly = bundle.visibility === 'MEMBERS_ONLY'

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 min-h-0"
      >
        <ChevronLeft className="w-4 h-4" />
        Назад
      </button>

      {/* Image */}
      {bundle.imageUrl ? (
        <img src={bundle.imageUrl} alt={bundle.title} className="w-full h-48 object-cover rounded-xl mb-4" />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
          <span className="text-5xl">&#x1F381;</span>
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {bundle.discountPercent && (
          <span className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-lg font-bold badge">
            -{bundle.discountPercent}%
          </span>
        )}
        {bundle.totalPrice && (
          <span className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-lg font-bold badge">
            {formatPrice(bundle.totalPrice)}
          </span>
        )}
        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-sm font-semibold badge">
          Комбо &middot; {bundle.items.length} заведений
        </span>
        {isMembersOnly && (
          <span className="bg-deal-premium text-white px-2.5 py-1 rounded-lg text-sm font-semibold badge">
            Plus
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{bundle.title}</h1>
      {bundle.subtitle && <p className="text-gray-600 mb-4">{bundle.subtitle}</p>}

      {/* Description */}
      {bundle.description && (
        <p className="text-gray-700 mb-4 leading-relaxed">{bundle.description}</p>
      )}

      {/* Bundle items */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Store className="w-4 h-4 text-indigo-600" />
          Что входит в комбо
        </h2>
        <div className="space-y-3">
          {bundle.items.map((item, idx) => (
            <div key={item.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm">{item.itemTitle}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{item.place.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{item.place.address}, {item.place.city}</p>
                  {item.itemValue && (
                    <p className="text-xs text-gray-500 mt-1">
                      Стоимость: {formatPrice(item.itemValue)}
                    </p>
                  )}
                  {item.offer && (
                    <Link
                      href={`/offers/${item.offer.id}`}
                      className="inline-block mt-1 text-xs text-brand-600 hover:underline"
                    >
                      Связанная скидка: {item.offer.title}
                    </Link>
                  )}
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Validity */}
      <div className="mb-4 bg-blue-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700">Срок действия</h3>
        </div>
        <p className="text-sm text-gray-600">
          С {new Date(bundle.validFrom).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          {bundle.validUntil && (
            <> по {new Date(bundle.validUntil).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</>
          )}
        </p>
      </div>

      {/* Stats */}
      {bundle._count.redemptions > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Tag className="w-4 h-4" />
          <span>{bundle._count.redemptions} раз использовано</span>
        </div>
      )}

      {/* CTA */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:static md:border-0 md:p-0 z-40">
        <div className="max-w-2xl mx-auto">
          {authLoading ? (
            <div className="w-full bg-gray-200 text-gray-400 py-3.5 rounded-xl font-medium text-center">
              Загрузка...
            </div>
          ) : !user ? (
            <button
              onClick={() => showAuthPrompt('Войдите, чтобы использовать комбо', `/bundles/${id}`)}
              className="w-full text-center bg-brand-600 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Войдите, чтобы активировать
            </button>
          ) : isMembersOnly ? (
            <div className="space-y-2">
              <Link
                href="/subscription"
                className="block w-full text-center bg-deal-premium text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Подпишитесь для доступа
              </Link>
              <p className="text-xs text-center text-gray-400">
                От 199 &#8381;/мес — 7 дней бесплатно
              </p>
            </div>
          ) : (
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-lg disabled:opacity-50"
            >
              {redeeming ? 'Активация...' : 'Использовать комбо'}
            </button>
          )}
        </div>
      </div>

      <AuthPrompt {...authPromptProps} />
    </div>
  )
}
