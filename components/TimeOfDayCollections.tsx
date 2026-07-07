'use client'

import { useEffect, useState } from 'react'
import { useCity } from '@/components/CitySelector'
import { OfferCard } from '@/components/OfferCard'

interface TimeOfDayOffer {
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
  branchLat: number | null
  branchLng: number | null
  nearestMetro: string | null
  isVerified: boolean
  redemptionCount: number
  maxRedemptions: number | null
  expiresAt: string | null
  isFlash: boolean
  reviewCount: number
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>
}

interface TimeOfDaySection {
  slug: string
  title: string
  emoji: string
  offers: TimeOfDayOffer[]
}

export function TimeOfDayCollections() {
  const { city, district } = useCity()
  const [sections, setSections] = useState<TimeOfDaySection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (district) params.set('district', district.slug)

    fetch(`/api/collections/time-of-day?${params}`)
      .then((r) => r.json())
      .then((data) => setSections(data.sections || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [city, district?.slug])

  if (loading || sections.length === 0) return null

  return (
    <div className="mb-6">
      {sections.map((section) => (
        <div key={section.slug} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg" aria-hidden="true">{section.emoji}</span>
            <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x snap-mandatory">
            {section.offers.map((offer) => (
              <div key={offer.id} className="w-[260px] shrink-0 snap-start">
                <OfferCard
                  id={offer.id}
                  title={offer.title}
                  subtitle={offer.subtitle}
                  offerType={offer.offerType}
                  visibility={offer.visibility}
                  benefitType={offer.benefitType}
                  benefitValue={Number(offer.benefitValue)}
                  imageUrl={offer.imageUrl}
                  branchName={offer.branchName}
                  branchAddress={offer.branchAddress}
                  branchLat={offer.branchLat ?? null}
                  branchLng={offer.branchLng ?? null}
                  nearestMetro={offer.nearestMetro}
                  isVerified={offer.isVerified}
                  redemptionCount={offer.redemptionCount}
                  maxRedemptions={offer.maxRedemptions}
                  expiresAt={offer.expiresAt}
                  isFlash={offer.isFlash}
                  reviewCount={offer.reviewCount}
                  schedules={offer.schedules}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
