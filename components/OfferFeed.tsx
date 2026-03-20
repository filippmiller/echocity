'use client'

import { useEffect, useState } from 'react'
import { OfferCard } from './OfferCard'
import { OfferCardSkeleton } from './ui/OfferCardSkeleton'

interface ScheduleSlot {
  weekday: number
  startTime: string
  endTime: string
}

interface OfferData {
  id: string
  title: string
  subtitle: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branch: { title: string; address: string; city: string; nearestMetro?: string | null }
  merchant: { name: string; isVerified?: boolean }
  endAt?: string | null
  expiresAt?: string | null
  redemptionCount?: number
  maxRedemptions?: number | null
  isFlash?: boolean
  redemptionChannel?: string
  minOrderAmount?: number | null
  schedules?: ScheduleSlot[]
  nearestMetro?: string | null
  isVerified?: boolean
}

export function OfferFeed({ city, visibility, category, activeNow, metro }: { city?: string; visibility?: string; category?: string; activeNow?: boolean; metro?: string }) {
  const [offers, setOffers] = useState<OfferData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (visibility) params.set('visibility', visibility)
    if (category && category !== 'all') params.set('category', category)
    if (activeNow) params.set('activeNow', 'true')
    if (metro) params.set('metro', metro)

    fetch(`/api/offers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city, visibility, category, activeNow, metro])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-400">%</span>
        </div>
        <p className="text-gray-500 font-medium">Нет активных предложений</p>
        <p className="text-sm text-gray-400 mt-1">Попробуйте изменить фильтры</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {offers.map((offer) => (
        <OfferCard
          key={offer.id}
          id={offer.id}
          title={offer.title}
          subtitle={offer.subtitle}
          offerType={offer.offerType}
          visibility={offer.visibility}
          benefitType={offer.benefitType}
          benefitValue={Number(offer.benefitValue)}
          imageUrl={offer.imageUrl}
          branchName={offer.branch.title}
          branchAddress={offer.branch.address}
          expiresAt={offer.expiresAt || offer.endAt}
          redemptionCount={offer.redemptionCount}
          maxRedemptions={offer.maxRedemptions}
          isFlash={offer.isFlash}
          redemptionChannel={offer.redemptionChannel}
          schedules={offer.schedules}
          nearestMetro={offer.nearestMetro ?? offer.branch?.nearestMetro}
          isVerified={offer.isVerified ?? offer.merchant?.isVerified}
        />
      ))}
    </div>
  )
}
