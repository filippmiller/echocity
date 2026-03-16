'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'

interface PendingOffer {
  id: string
  title: string
  offerType: string
  benefitType: string
  benefitValue: number
  visibility: string
  branch: { title: string; address: string; city: string }
  merchant: { name: string }
  createdBy: { firstName: string; email: string }
  createdAt: string
}

export default function AdminModerationPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<PendingOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadOffers = () => {
    fetch('/api/admin/offers?status=PENDING')
      .then((r) => r.json())
      .then((data) => { setOffers(data.offers || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') loadOffers()
  }, [user])

  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/offers/${id}/approve`, { method: 'POST' })
    loadOffers()
  }

  const handleReject = async () => {
    if (!rejectId || !rejectReason) return
    await fetch(`/api/admin/offers/${rejectId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason }),
    })
    setRejectId(null)
    setRejectReason('')
    loadOffers()
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8 text-gray-500">Загрузка...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Модерация предложений</h1>

      {offers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          Нет предложений на модерации
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{offer.merchant.name} — {offer.branch.title}, {offer.branch.city}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {offer.offerType} | {offer.benefitType}: {Number(offer.benefitValue)} | {offer.visibility}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">от {offer.createdBy.firstName} ({offer.createdBy.email})</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(offer.id)}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700">
                    Одобрить
                  </button>
                  <button onClick={() => setRejectId(offer.id)}
                    className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700">
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRejectId(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">Причина отклонения</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm mb-3"
              rows={3}
              placeholder="Укажите причину..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Отмена</button>
              <button onClick={handleReject} disabled={!rejectReason}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
