'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, BadgeCheck, MessageSquare, Tag, Loader2 } from 'lucide-react'

interface Bid {
  id: string
  merchantId: string
  merchantName: string
  isVerified: boolean
  message: string | null
  status: string
  createdAt: string
  offer: {
    id: string
    title: string
    benefitType: string
    benefitValue: number
    imageUrl: string | null
  } | null
}

interface DemandInfo {
  id: string
  placeName: string
  placeAddress: string | null
  supportCount: number
  status: string
}

function getBenefitBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    default: return `${benefitValue}`
  }
}

export function DemandBids({ demandId }: { demandId: string }) {
  const [bids, setBids] = useState<Bid[]>([])
  const [demand, setDemand] = useState<DemandInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/demand/${demandId}/bids`)
      .then((r) => r.json())
      .then((data) => {
        setBids(data.bids || [])
        setDemand(data.demand || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [demandId])

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (bids.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Пока нет предложений от заведений</p>
        <p className="text-xs text-gray-400 mt-1">Поддержите запрос — чем больше голосов, тем быстрее ответят!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Store className="w-4 h-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-gray-800">
          Предложения от заведений ({bids.length})
        </h3>
      </div>

      {bids.map((bid) => (
        <div
          key={bid.id}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
        >
          {/* Merchant header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <Store className="w-4 h-4 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-900 truncate">{bid.merchantName}</span>
                {bid.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(bid.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>

          {/* Message */}
          {bid.message && (
            <p className="text-sm text-gray-600 mb-2">{bid.message}</p>
          )}

          {/* Linked offer */}
          {bid.offer && (
            <Link
              href={`/offers/${bid.offer.id}`}
              className="block bg-brand-50 rounded-lg p-3 hover:bg-brand-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-sm font-medium text-brand-700 flex-1 truncate">
                  {bid.offer.title}
                </span>
                <span className="bg-brand-600 text-white px-2 py-0.5 rounded text-xs font-bold shrink-0">
                  {getBenefitBadge(bid.offer.benefitType, bid.offer.benefitValue)}
                </span>
              </div>
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
