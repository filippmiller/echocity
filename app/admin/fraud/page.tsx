'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { ShieldAlert, Loader2, AlertCircle } from 'lucide-react'

interface RiskOffer {
  id: string
  title: string
  createdAt: string
  riskScore: number
  reasons: string[]
  meta: {
    merchantName?: string
    branchTitle?: string
    city?: string
    createdByEmail?: string
    offerType?: string
    benefitType?: string
    benefitValue?: number
  }
}

function riskBadgeClass(score: number) {
  if (score >= 70) return 'bg-rose-100 text-rose-700 border-rose-200'
  if (score >= 40) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

export default function AdminFraudPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<RiskOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    fetch('/api/admin/moderation/queue?type=offer')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load risk data')
        return r.json()
      })
      .then((data) => {
        const list: RiskOffer[] = (data.items || [])
          .filter((i: RiskOffer) => typeof i.riskScore === 'number')
          .sort((a: RiskOffer, b: RiskOffer) => b.riskScore - a.riskScore)
        setOffers(list)
      })
      .catch(() => toast.error('Не удалось загрузить фрод-оценки'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-deal-flash" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Фрод-мониторинг</h1>
          <p className="text-sm text-gray-500">Риск-скоринг офферов на модерации</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {!loading && offers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <ShieldAlert className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold">Нет данных</p>
          <p className="text-sm text-gray-500 mt-1">Нет офферов на модерации</p>
        </div>
      )}

      {!loading && offers.length > 0 && (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskBadgeClass(offer.riskScore)}`}>
                      Risk {offer.riskScore}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(offer.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{offer.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {offer.meta.merchantName} — {offer.meta.branchTitle}, {offer.meta.city}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {offer.meta.offerType} · {offer.meta.benefitType}: {offer.meta.benefitValue}
                  </p>
                </div>
              </div>

              {offer.reasons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Факторы риска
                  </h4>
                  <ul className="space-y-1">
                    {offer.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
