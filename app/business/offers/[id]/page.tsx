'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'

export default function BusinessOfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/offers/${id}`)
      .then((r) => r.json())
      .then((data) => { setOffer(data.offer); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Загрузка...</div>
  if (!offer) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-500">Предложение не найдено</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{offer.title}</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Тип:</span> {offer.offerType}
          </div>
          <div>
            <span className="text-gray-500">Выгода:</span> {offer.benefitType} — {Number(offer.benefitValue)}
          </div>
          <div>
            <span className="text-gray-500">Статус модерации:</span> {offer.approvalStatus}
          </div>
          <div>
            <span className="text-gray-500">Жизненный цикл:</span> {offer.lifecycleStatus}
          </div>
          <div>
            <span className="text-gray-500">Видимость:</span> {offer.visibility}
          </div>
          <div>
            <span className="text-gray-500">Заведение:</span> {offer.branch?.title}
          </div>
        </div>

        {offer.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800"><strong>Причина отклонения:</strong> {offer.rejectionReason}</p>
          </div>
        )}

        {offer.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Описание</h3>
            <p className="text-sm text-gray-600">{offer.description}</p>
          </div>
        )}

        {offer.termsText && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Условия</h3>
            <p className="text-sm text-gray-600">{offer.termsText}</p>
          </div>
        )}
      </div>
    </div>
  )
}
