'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'
import { MapPin, Clock, Shield, ChevronLeft, Flag, Globe, Copy } from 'lucide-react'
import { ComplaintSheet } from '@/components/ComplaintSheet'
import { AuthPrompt } from '@/components/AuthPrompt'
import { useAuthPrompt } from '@/lib/useAuthPrompt'
import OfferReviews from '@/components/OfferReviews'
import { FavoriteButton } from '@/components/FavoriteButton'

interface OfferDetail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  currency: string
  minOrderAmount: number | null
  maxDiscountAmount: number | null
  startAt: string
  endAt: string | null
  termsText: string | null
  imageUrl: string | null
  lifecycleStatus: string
  redemptionChannel?: string
  onlineUrl?: string | null
  promoCode?: string | null
  branch: { id: string; title: string; address: string; city: string }
  merchant: { id: string; name: string }
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>
  limits: { dailyLimit: number | null; totalLimit: number | null; perUserDailyLimit: number | null } | null
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getBenefitText(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `Скидка ${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return String(benefitValue)
  }
}

function getVisibilityLabel(visibility: string) {
  switch (visibility) {
    case 'FREE_FOR_ALL': return 'Бесплатно для всех'
    case 'MEMBERS_ONLY': return 'Только для подписчиков'
    case 'PUBLIC': return 'Для всех'
    default: return ''
  }
}

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showComplaint, setShowComplaint] = useState(false)
  const { authPromptProps, showAuthPrompt } = useAuthPrompt()

  useEffect(() => {
    fetch(`/api/offers/${id}`)
      .then((r) => r.json())
      .then((data) => { setOffer(data.offer); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

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

  if (!offer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Предложение не найдено</h2>
        <p className="text-gray-500 mb-6">Возможно, оно было удалено или срок действия истёк</p>
        <Link href="/offers" className="text-brand-600 font-medium hover:underline">
          Все скидки &rarr;
        </Link>
      </div>
    )
  }

  const isMembersOnly = offer.visibility === 'MEMBERS_ONLY'
  const benefitText = getBenefitText(offer.benefitType, Number(offer.benefitValue))

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 min-h-0"
      >
        <ChevronLeft className="w-4 h-4" />
        Назад
      </button>

      {/* Image or placeholder */}
      {offer.imageUrl ? (
        <img src={offer.imageUrl} alt={offer.title} className="w-full h-48 object-cover rounded-xl mb-4" />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl mb-4 flex items-center justify-center">
          <span className="text-5xl font-bold text-brand-600 opacity-30">%</span>
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-deal-discount text-white px-3 py-1.5 rounded-lg text-lg font-bold badge">
          {benefitText}
        </span>
        {isMembersOnly && (
          <span className="bg-deal-premium text-white px-2.5 py-1 rounded-lg text-sm font-semibold badge">
            Plus
          </span>
        )}
      </div>

      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
        <FavoriteButton entityType="OFFER" entityId={offer.id} size="md" className="shrink-0 mt-1" />
      </div>
      {offer.subtitle && <p className="text-gray-600 mb-4">{offer.subtitle}</p>}

      {/* Branch info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-700">{offer.branch.title}</p>
          <p className="text-sm text-gray-500">{offer.branch.address}, {offer.branch.city}</p>
          <p className="text-xs text-gray-400 mt-1">{offer.merchant.name}</p>
        </div>
      </div>

      {/* Description */}
      {offer.description && (
        <p className="text-gray-700 mb-4 leading-relaxed">{offer.description}</p>
      )}

      {/* Schedule */}
      {offer.schedules.length > 0 && (
        <div className="mb-4 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-700">Расписание</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {offer.schedules.map((s, i) => (
              <span key={i} className="text-xs bg-white px-2.5 py-1 rounded-full text-gray-600 border border-blue-100">
                {WEEKDAYS[s.weekday]} {s.startTime}–{s.endTime}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Online redemption */}
      {(offer.redemptionChannel === 'ONLINE' || offer.redemptionChannel === 'BOTH') && (
        <div className="mb-4 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">Использовать онлайн</h3>
          </div>
          {offer.promoCode && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Промокод:</span>
              <code className="bg-white border border-blue-200 px-3 py-1 rounded-lg text-sm font-mono font-bold text-blue-700 select-all">
                {offer.promoCode}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(offer.promoCode!); }}
                className="text-blue-500 hover:text-blue-700 p-1"
                title="Скопировать"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
          {offer.onlineUrl && (
            <a
              href={offer.onlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Перейти на сайт &rarr;
            </a>
          )}
          {offer.redemptionChannel === 'BOTH' && (
            <p className="text-xs text-gray-500 mt-2">
              Также можно использовать в заведении.
            </p>
          )}
        </div>
      )}

      {/* Terms */}
      {offer.termsText && (
        <div className="mb-4 bg-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-700">Условия</h3>
          </div>
          <p className="text-sm text-gray-600">{offer.termsText}</p>
        </div>
      )}

      {/* Limits info */}
      {offer.limits && (
        <div className="mb-4 text-sm text-gray-500 space-y-1">
          {offer.limits.dailyLimit && <p>Лимит на день: {offer.limits.dailyLimit} использований</p>}
          {offer.limits.perUserDailyLimit && <p>Для вас: {offer.limits.perUserDailyLimit} раз в день</p>}
        </div>
      )}

      {offer.minOrderAmount && (
        <p className="text-sm text-gray-500 mb-4">
          Минимальный заказ: {Math.round(Number(offer.minOrderAmount))}{'\u20BD'}
        </p>
      )}

      {/* Visibility label */}
      <p className="text-xs text-gray-400 mb-4">{getVisibilityLabel(offer.visibility)}</p>

      {/* Report link */}
      {user && (
        <button
          onClick={() => setShowComplaint(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <Flag className="w-3.5 h-3.5" />
          Пожаловаться
        </button>
      )}

      {/* Complaint Sheet */}
      {showComplaint && (
        <ComplaintSheet
          offerId={offer.id}
          placeId={offer.branch.id}
          onClose={() => setShowComplaint(false)}
        />
      )}

      {/* Reviews */}
      <div className="mb-6">
        <OfferReviews offerId={offer.id} />
      </div>

      {/* CTA */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:static md:border-0 md:p-0 z-40">
        <div className="max-w-2xl mx-auto">
          {authLoading ? (
            <div className="w-full bg-gray-200 text-gray-400 py-3.5 rounded-xl font-medium text-center">
              Загрузка...
            </div>
          ) : !user ? (
            <button
              onClick={() => showAuthPrompt('Войдите, чтобы активировать скидку и получить QR-код', `/offers/${id}`)}
              className="w-full text-center bg-brand-600 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Войдите, чтобы активировать
            </button>
          ) : isMembersOnly ? (
            <Link
              href="/subscription"
              className="block w-full text-center bg-deal-premium text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Подпишитесь для доступа
            </Link>
          ) : (
            <button
              onClick={() => router.push(`/offers/${id}/redeem`)}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-lg"
            >
              Активировать
            </button>
          )}
        </div>
      </div>

      {/* Auth prompt for guests */}
      <AuthPrompt {...authPromptProps} />
    </div>
  )
}
