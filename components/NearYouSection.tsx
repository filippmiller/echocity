'use client'

import { useState, useCallback } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { OfferCard } from '@/components/OfferCard'

interface NearbyOffer {
  id: string
  title: string
  subtitle?: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: string
  imageUrl?: string | null
  branchTitle: string
  branchAddress: string
  branchLat: number
  branchLng: number
  distance: number
  endAt?: string | null
  redemptionChannel?: string
}

type LocationState = 'idle' | 'requesting' | 'loading' | 'loaded' | 'denied' | 'error'

export function NearYouSection() {
  const [state, setState] = useState<LocationState>('idle')
  const [offers, setOffers] = useState<NearbyOffer[]>([])
  const [distanceLabel, setDistanceLabel] = useState('')

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('error')
      return
    }

    setState('requesting')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setState('loading')
        const { latitude, longitude } = position.coords

        try {
          const response = await fetch(
            `/api/offers/nearby?lat=${latitude}&lng=${longitude}&radius=10&city=Санкт-Петербург`
          )
          if (!response.ok) throw new Error('Failed to fetch')
          const data = await response.json()
          const nearbyOffers = (data.offers || data) as NearbyOffer[]

          if (nearbyOffers.length > 0) {
            const closest = nearbyOffers[0].distance
            setDistanceLabel(
              closest < 1 ? `${Math.round(closest * 1000)}м от вас` : `${closest.toFixed(1)}км от вас`
            )
          }

          setOffers(nearbyOffers.slice(0, 8))
          setState('loaded')
        } catch {
          setState('error')
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState('denied')
        } else {
          setState('error')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  // Idle state — show CTA button
  if (state === 'idle') {
    return (
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={requestLocation}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-2xl py-4 px-6 transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Скидки рядом с вами</p>
              <p className="text-xs text-gray-500">Нажмите, чтобы найти предложения поблизости</p>
            </div>
            <MapPin className="w-5 h-5 text-brand-600 ml-auto shrink-0" />
          </button>
        </div>
      </section>
    )
  }

  // Requesting / Loading state
  if (state === 'requesting' || state === 'loading') {
    return (
      <section className="py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 bg-blue-50 rounded-2xl py-6 px-6">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
            <span className="text-sm text-gray-600">
              {state === 'requesting' ? 'Определяем местоположение...' : 'Ищем скидки рядом...'}
            </span>
          </div>
        </div>
      </section>
    )
  }

  // Denied / Error
  if (state === 'denied' || state === 'error') {
    return null // Gracefully disappear
  }

  // Loaded with results
  if (offers.length === 0) return null

  return (
    <section className="py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <h2 className="font-bold text-gray-900">Рядом с вами</h2>
            {distanceLabel && (
              <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full font-medium">
                {distanceLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {offers.map((offer) => (
            <div key={offer.id} className="w-[260px] shrink-0">
              <OfferCard
                id={offer.id}
                title={offer.title}
                subtitle={offer.subtitle}
                offerType={offer.offerType}
                visibility={offer.visibility}
                benefitType={offer.benefitType}
                benefitValue={Number(offer.benefitValue)}
                imageUrl={offer.imageUrl}
                branchName={offer.branchTitle}
                branchAddress={offer.branchAddress}
                distance={offer.distance}
                expiresAt={offer.endAt}
                redemptionChannel={offer.redemptionChannel}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
