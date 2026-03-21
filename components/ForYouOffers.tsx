'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { OfferCard } from './OfferCard'

interface ForYouOffer {
  id: string
  title: string
  subtitle: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branchName: string
  branchAddress: string
  nearestMetro: string | null
  isVerified: boolean
  redemptionCount: number
  maxRedemptions: number | null
  expiresAt: string | null
  isFlash: boolean
  reviewCount: number
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>
}

export function ForYouOffers({ city }: { city?: string }) {
  const { user } = useAuth()
  const [offers, setOffers] = useState<ForYouOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const params = new URLSearchParams()
    if (city) params.set('city', city)

    fetch(`/api/offers/for-you?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user, city])

  // Don't render for unauthenticated users or if no recommendations
  if (!user || loading || offers.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Для вас</h2>
        <span className="text-xs text-gray-400 ml-auto">на основе ваших предпочтений</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            id={offer.id}
            title={offer.title}
            subtitle={offer.subtitle}
            offerType={offer.offerType}
            visibility={offer.visibility}
            benefitType={offer.benefitType}
            benefitValue={offer.benefitValue}
            imageUrl={offer.imageUrl}
            branchName={offer.branchName}
            branchAddress={offer.branchAddress}
            expiresAt={offer.expiresAt}
            redemptionCount={offer.redemptionCount}
            maxRedemptions={offer.maxRedemptions}
            isFlash={offer.isFlash}
            schedules={offer.schedules}
            nearestMetro={offer.nearestMetro}
            isVerified={offer.isVerified}
            reviewCount={offer.reviewCount}
          />
        ))}
      </div>
    </div>
  )
}
