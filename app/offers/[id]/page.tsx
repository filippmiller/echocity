'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'

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
  branch: { id: string; title: string; address: string; city: string }
  merchant: { id: string; name: string }
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>
  limits: { dailyLimit: number | null; totalLimit: number | null } | null
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getBenefitText(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `Скидка ${benefitValue}%`
    case 'FIXED_AMOUNT': return `Скидка ${benefitValue / 100}\u20BD`
    case 'FIXED_PRICE': return `Цена ${benefitValue / 100}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return String(benefitValue)
  }
}

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/offers/${id}`)
      .then((r) => r.json())
      .then((data) => { setOffer(data.offer); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Загрузка...</div>
  if (!offer) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-500">Предложение не найдено</div>

  const isMembersOnly = offer.visibility === 'MEMBERS_ONLY'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {offer.imageUrl && (
        <img src={offer.imageUrl} alt={offer.title} className="w-full h-48 object-cover rounded-xl mb-4" />
      )}

      <div className="bg-red-500 text-white inline-block px-3 py-1 rounded-lg text-lg font-bold mb-3">
        {getBenefitText(offer.benefitType, Number(offer.benefitValue))}
      </div>

      {isMembersOnly && (
        <span className="ml-2 bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-medium">Plus</span>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{offer.title}</h1>
      {offer.subtitle && <p className="text-gray-600 mb-3">{offer.subtitle}</p>}

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-gray-700">{offer.branch.title}</p>
        <p className="text-sm text-gray-500">{offer.branch.address}, {offer.branch.city}</p>
      </div>

      {offer.description && <p className="text-gray-700 mb-4">{offer.description}</p>}

      {offer.schedules.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Расписание</h3>
          <div className="text-sm text-gray-600">
            {offer.schedules.map((s, i) => (
              <span key={i}>{WEEKDAYS[s.weekday]} {s.startTime}-{s.endTime}{i < offer.schedules.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
        </div>
      )}

      {offer.termsText && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Условия</h3>
          <p className="text-sm text-gray-600">{offer.termsText}</p>
        </div>
      )}

      {offer.minOrderAmount && (
        <p className="text-sm text-gray-500 mb-4">Минимальный заказ: {Number(offer.minOrderAmount) / 100}{'\u20BD'}</p>
      )}

      <div className="mt-6">
        {!user ? (
          <Link href="/auth/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700">
            Войдите, чтобы активировать
          </Link>
        ) : (
          <button
            onClick={() => router.push(`/offers/${id}/redeem`)}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 text-lg"
          >
            Активировать
          </button>
        )}
      </div>
    </div>
  )
}
