'use client'

import { useEffect, useState } from 'react'
import { OfferCard } from '@/components/OfferCard'

interface RecommendedOffer {
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

export function ForYouSection() {
  const [offers, setOffers] = useState<RecommendedOffer[]>([])
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/offers/recommended?limit=10')
      .then((res) => res.json())
      .then((data) => {
        setOffers(data.offers || [])
        setIsPersonalized(data.isPersonalized || false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[260px] shrink-0">
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
      </section>
    )
  }

  if (offers.length === 0) return null

  return (
    <section className="py-6 px-4 bg-gradient-to-r from-brand-50/50 to-blue-50/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isPersonalized ? '\u2728' : '\uD83D\uDD25'}</span>
            <h2 className="font-bold text-gray-900">
              {isPersonalized ? 'Для вас' : 'Популярное'}
            </h2>
            {isPersonalized && (
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                Персональное
              </span>
            )}
          </div>
        </div>

        {/* Mobile: horizontal scroll; Desktop: grid */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible">
          {offers.map((offer) => (
            <div key={offer.id} className="w-[260px] shrink-0 md:w-auto">
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
    </section>
  )
}
