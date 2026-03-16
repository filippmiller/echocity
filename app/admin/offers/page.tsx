'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Clock, Tag, Loader2 } from 'lucide-react'

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

export default function AdminOffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<PendingOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadOffers = () => {
    fetch('/api/admin/offers?status=PENDING')
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') loadOffers()
  }, [user])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/offers/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Оффер одобрен')
      loadOffers()
    } catch {
      toast.error('Не удалось одобрить оффер')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return
    setActionLoading(rejectId)
    try {
      const res = await fetch(`/api/admin/offers/${rejectId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (!res.ok) throw new Error()
      toast.success('Оффер отклонен')
      setRejectId(null)
      setRejectReason('')
      loadOffers()
    } catch {
      toast.error('Не удалось отклонить оффер')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
          <Tag className="w-5 h-5 text-deal-urgent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Модерация офферов</h1>
          <p className="text-sm text-gray-500">
            {loading ? '...' : `${offers.length} на рассмотрении`}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && offers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-deal-savings" />
          </div>
          <p className="text-gray-900 font-semibold">Все проверено</p>
          <p className="text-sm text-gray-500 mt-1">Нет предложений на модерации</p>
        </div>
      )}

      {/* Offers list */}
      {!loading && offers.length > 0 && (
        <div className="space-y-3">
          {offers.map((offer) => {
            const isProcessing = actionLoading === offer.id
            return (
              <div
                key={offer.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{offer.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {offer.merchant.name} — {offer.branch.title}, {offer.branch.city}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {offer.offerType}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-deal-discount/10 text-deal-discount">
                        {offer.benefitType}: {Number(offer.benefitValue)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600">
                        {offer.visibility}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      от {offer.createdBy.firstName} ({offer.createdBy.email})
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 sm:flex-col sm:items-end shrink-0">
                    <button
                      onClick={() => handleApprove(offer.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-deal-savings text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Одобрить
                    </button>
                    <button
                      onClick={() => setRejectId(offer.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white text-deal-discount border border-deal-discount/30 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setRejectId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-deal-discount" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Отклонить оффер</h3>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Укажите причину отклонения..."
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setRejectId(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === rejectId}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-deal-discount text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === rejectId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
