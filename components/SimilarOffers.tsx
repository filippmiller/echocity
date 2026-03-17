'use client'

import { useEffect, useState } from 'react'
import { OfferCard } from '@/components/OfferCard'

interface SimilarOffer {
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
  expiresAt: string | null
  isFlash: boolean
  maxRedemptions: number | null
  redemptionChannel?: string
}

interface SimilarOffersProps {
  offerId: string
}

export function SimilarOffers({ offerId }: SimilarOffersProps) {
  const [offers, setOffers] = useState<SimilarOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/offers/${offerId}/similar?limit=5`)
      .then((res) => res.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [offerId])

  if (loading) {
    return (
      <div className="mt-8">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[220px] shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-[16/10] bg-gray-200 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (offers.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">{'\uD83D\uDCA1'}</span>
        Похожие предложения
      </h2>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {offers.map((offer) => (
          <div key={offer.id} className="w-[220px] shrink-0">
            <OfferCard
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
              isFlash={offer.isFlash}
              maxRedemptions={offer.maxRedemptions}
              redemptionChannel={offer.redemptionChannel}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
