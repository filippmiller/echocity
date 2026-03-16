'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'

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
    await fetch(`/api/business/offers/${offerId}/${action}`, { method: 'POST' })
    const res = await fetch('/api/business/offers')
    const data = await res.json()
    setOffers(data.offers || [])
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8 text-gray-500">Загрузка...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои предложения</h1>
        <Link href="/business/offers/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          Создать
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          У вас пока нет предложений. Создайте первое!
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Название</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Заведение</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Жизненный цикл</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="px-4 py-3">
                    <Link href={`/business/offers/${offer.id}`} className="text-blue-600 hover:underline font-medium">
                      {offer.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{offer.branch.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[offer.approvalStatus] || ''}`}>
                      {offer.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[offer.lifecycleStatus] || ''}`}>
                      {offer.lifecycleStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {offer.approvalStatus === 'DRAFT' && (
                      <button onClick={() => handleAction(offer.id, 'submit')} className="text-xs text-blue-600 hover:underline">Отправить</button>
                    )}
                    {offer.lifecycleStatus === 'ACTIVE' && (
                      <button onClick={() => handleAction(offer.id, 'pause')} className="text-xs text-orange-600 hover:underline">Пауза</button>
                    )}
                    {offer.lifecycleStatus === 'PAUSED' && (
                      <button onClick={() => handleAction(offer.id, 'resume')} className="text-xs text-green-600 hover:underline">Возобновить</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
