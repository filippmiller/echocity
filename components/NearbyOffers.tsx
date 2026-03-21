'use client'

import { useState, useEffect } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { OfferCard } from './OfferCard'

interface NearbyOffer {
  id: string
  title: string
  subtitle: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branchTitle: string
  branchAddress: string
  branchLat: number
  branchLng: number
  distance: number
}

export function NearbyOffers({ city }: { city?: string }) {
  const [offers, setOffers] = useState<NearbyOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [prompted, setPrompted] = useState(false)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationDenied(true)
      return
    }
    setLoading(true)
    setPrompted(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        fetch(`/api/offers/nearby?lat=${latitude}&lng=${longitude}&radius=3000&limit=6`)
          .then((r) => r.json())
          .then((data) => {
            setOffers((data.offers || []).map((o: any) => ({
              ...o,
              branchTitle: o.branch?.title ?? '',
              branchAddress: o.branch?.address ?? '',
              distance: o.distance / 1000, // meters → km for OfferCard
            })))
            setLoading(false)
          })
          .catch(() => setLoading(false))
      },
      () => {
        setLocationDenied(true)
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  // Auto-request if permission was previously granted
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        requestLocation()
      }
    }).catch(() => {})
  }, [])

  if (locationDenied) return null

  if (!prompted) {
    return (
      <div className="mb-6">
        <button
          onClick={requestLocation}
          className="w-full flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 hover:bg-blue-100 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Скидки рядом с вами</p>
            <p className="text-xs text-gray-500">Разрешите геолокацию, чтобы увидеть ближайшие предложения</p>
          </div>
          <MapPin className="w-5 h-5 text-blue-400 shrink-0 ml-auto" />
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-bold text-gray-900">Рядом с вами</h2>
        </div>
        <div className="text-sm text-gray-400 py-4 text-center">Определяем местоположение...</div>
      </div>
    )
  }

  if (offers.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
          <Navigation className="w-4 h-4 text-blue-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Рядом с вами</h2>
        <span className="text-xs text-gray-400 ml-auto">до 3 км</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {offers.slice(0, 6).map((offer) => (
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
            branchName={offer.branchTitle}
            branchAddress={offer.branchAddress}
            distance={offer.distance}
          />
        ))}
      </div>
    </div>
  )
}
