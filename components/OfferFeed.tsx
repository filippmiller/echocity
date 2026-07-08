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
  branch: { title: string; address: string; city: string; nearestMetro?: string | null; lat?: number | null; lng?: number | null }
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
  reviewCount?: number
  avgRating?: number | null
  branchLat?: number | null
  branchLng?: number | null
  branchAddress?: string | null
  metadata?: unknown
}

export function OfferFeed({ city, visibility, category, activeNow, metro, district, benefitType, sort, onClearFilters }: { city?: string; visibility?: string; category?: string; activeNow?: boolean; metro?: string; district?: string; benefitType?: string; sort?: string; onClearFilters?: () => void }) {
  const [offers, setOffers] = useState<OfferData[]>([])
  const [loading, setLoading] = useState(true)
  const hasActiveFilters = Boolean(visibility || (category && category !== 'all') || activeNow || metro || district || benefitType || (sort && sort !== 'recommended'))

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (visibility) params.set('visibility', visibility)
    if (category && category !== 'all') params.set('category', category)
    if (activeNow) params.set('activeNow', 'true')
    if (metro) params.set('metro', metro)
    if (district) params.set('district', district)
    if (benefitType) params.set('benefitType', benefitType)
    if (sort && sort !== 'recommended') params.set('sort', sort)

    const buildAndFetch = (lat?: number, lng?: number) => {
      if (lat != null && lng != null) {
        params.set('lat', lat.toString())
        params.set('lng', lng.toString())
      }
      fetch(`/api/offers?${params}`)
        .then((r) => r.json())
        .then((data) => {
          setOffers(data.offers || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => buildAndFetch(pos.coords.latitude, pos.coords.longitude),
        () => buildAndFetch(),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 }
      )
    } else {
      buildAndFetch()
    }
  }, [city, visibility, category, activeNow, metro, district, benefitType, sort])

  if (loading) {
    return (
      <div className="ec-panel divide-y ec-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="ec-panel px-4 py-6 text-left">
        <p className="text-[color:var(--ec-text)] font-semibold text-base">Нет подходящих предложений</p>
        <p className="text-sm ec-muted mt-1 max-w-md">
          {hasActiveFilters
            ? 'Попробуйте изменить фильтры или сбросить их, чтобы увидеть все скидки.'
            : 'Первые партнёры подключаются. Загляните позже или посмотрите другие разделы.'}
        </p>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="ec-button mt-4 px-4 py-2 text-sm transition-opacity hover:opacity-90"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="ec-panel divide-y ec-line px-3 md:px-4">
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
          expiresAt={offer.expiresAt || offer.endAt}
          redemptionCount={offer.redemptionCount}
          maxRedemptions={offer.maxRedemptions}
          isFlash={offer.isFlash}
          redemptionChannel={offer.redemptionChannel}
          schedules={offer.schedules}
          nearestMetro={offer.nearestMetro ?? offer.branch?.nearestMetro}
          isVerified={offer.isVerified ?? offer.merchant?.isVerified}
          reviewCount={offer.reviewCount}
          avgRating={offer.avgRating}
          branchLat={offer.branchLat ?? offer.branch?.lat ?? null}
          branchLng={offer.branchLng ?? offer.branch?.lng ?? null}
          branchAddress={offer.branchAddress ?? offer.branch?.address ?? null}
          metadata={offer.metadata}
        />
      ))}
    </div>
  )
}
