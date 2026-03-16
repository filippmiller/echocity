'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'
import { toast } from 'sonner'

interface OfferRow {
  id: string
  title: string
  approvalStatus: string
  lifecycleStatus: string
  visibility: string
  benefitType: string
  benefitValue: number
  branch: { title: string; address: string }
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'На модерации',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
  ACTIVE: 'Активно',
  PAUSED: 'На паузе',
  EXPIRED: 'Истекло',
  INACTIVE: 'Неактивно',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-orange-100 text-orange-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
  INACTIVE: 'bg-gray-100 text-gray-500',
}

export default function BusinessOffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<OfferRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'BUSINESS_OWNER') return
    fetch('/api/business/offers')
      .then((r) => r.json())
      .then((data) => { setOffers(data.offers || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const handleAction = async (offerId: string, action: string) => {
    try {
      const res = await fetch(`/api/business/offers/${offerId}/${action}`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при выполнении действия')
        return
      }
      toast.success(action === 'submit' ? 'Отправлено на модерацию' : action === 'pause' ? 'Поставлено на паузу' : 'Возобновлено')
      const listRes = await fetch('/api/business/offers')
      const data = await listRes.json()
      setOffers(data.offers || [])
    } catch {
      toast.error('Ошибка сети')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Мои предложения</h1>
        <Link
          href="/business/offers/create"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors active:scale-[0.98]"
        >
          Создать
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">У вас пока нет предложений</p>
          <Link
            href="/business/offers/create"
            className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Создать первое предложение
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link href={`/business/offers/${offer.id}`} className="text-brand-600 font-semibold hover:underline">
                    {offer.title}
                  </Link>
                  <div className="flex gap-1.5 shrink-0 ml-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[offer.approvalStatus] || ''}`}>
                      {STATUS_LABELS[offer.approvalStatus] || offer.approvalStatus}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">{offer.branch.title}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[offer.lifecycleStatus] || ''}`}>
                    {STATUS_LABELS[offer.lifecycleStatus] || offer.lifecycleStatus}
                  </span>
                  <div className="flex gap-2">
                    {offer.approvalStatus === 'DRAFT' && (
                      <button onClick={() => handleAction(offer.id, 'submit')} className="text-sm text-brand-600 font-medium hover:underline">
                        Отправить
                      </button>
                    )}
                    {offer.lifecycleStatus === 'ACTIVE' && (
                      <button onClick={() => handleAction(offer.id, 'pause')} className="text-sm text-deal-urgent font-medium hover:underline">
                        Пауза
                      </button>
                    )}
                    {offer.lifecycleStatus === 'PAUSED' && (
                      <button onClick={() => handleAction(offer.id, 'resume')} className="text-sm text-deal-savings font-medium hover:underline">
                        Возобновить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Название</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Заведение</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Цикл</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/business/offers/${offer.id}`} className="text-brand-600 hover:underline font-medium">
                        {offer.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{offer.branch.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[offer.approvalStatus] || ''}`}>
                        {STATUS_LABELS[offer.approvalStatus] || offer.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[offer.lifecycleStatus] || ''}`}>
                        {STATUS_LABELS[offer.lifecycleStatus] || offer.lifecycleStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {offer.approvalStatus === 'DRAFT' && (
                        <button onClick={() => handleAction(offer.id, 'submit')} className="text-xs text-brand-600 font-medium hover:underline">
                          Отправить
                        </button>
                      )}
                      {offer.lifecycleStatus === 'ACTIVE' && (
                        <button onClick={() => handleAction(offer.id, 'pause')} className="text-xs text-deal-urgent font-medium hover:underline">
                          Пауза
                        </button>
                      )}
                      {offer.lifecycleStatus === 'PAUSED' && (
                        <button onClick={() => handleAction(offer.id, 'resume')} className="text-xs text-deal-savings font-medium hover:underline">
                          Возобновить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
