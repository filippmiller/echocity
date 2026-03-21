'use client'

import { useState, useEffect } from 'react'
import { Star, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { hapticTap } from '@/lib/haptics'
import { FavoriteButton } from './FavoriteButton'

interface TopRatedOffer {
  id: string
  title: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branchName: string
  nearestMetro: string | null
  isVerified: boolean
  reviewCount: number
  avgRating: number
}

function getBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    default: return `${benefitValue}`
  }
}

export function TopRatedOffers({ city }: { city?: string }) {
  const [offers, setOffers] = useState<TopRatedOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    params.set('limit', '6')

    fetch(`/api/offers/top-rated?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city])

  if (loading || offers.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Лучшие по отзывам</h2>
        <span className="text-xs text-gray-400 ml-auto">проверенные визиты</span>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/offers/${offer.id}`}
            onClick={hapticTap}
            className="flex-shrink-0 w-[200px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="relative h-24 bg-gradient-to-br from-yellow-50 to-amber-50">
              {offer.imageUrl ? (
                <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-400/50">{getBadge(offer.benefitType, offer.benefitValue)}</span>
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-white px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-white" />
                {offer.avgRating}
              </div>
              <div className="absolute top-1.5 right-1.5">
                <FavoriteButton entityType="OFFER" entityId={offer.id} size="sm" />
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-brand-600">{offer.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{offer.branchName}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <BadgeCheck className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 font-medium">
                  {offer.reviewCount} проверенных отзывов
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
