'use client'

import { useState, useEffect } from 'react'
import YandexMap from '@/components/YandexMap'
import { MapBottomSheet } from '@/components/MapBottomSheet'
import { useCity } from '@/components/CitySelector'
import { toast } from 'sonner'
import Link from 'next/link'
import { MapPin, ChevronDown } from 'lucide-react'

interface Place {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  addressLine1?: string | null
  placeType?: string | null
}

interface DistrictOption {
  id: string
  name: string
  slug: string
}

export default function MapPage() {
  const { city, district: storedDistrict, changeDistrict, districts } = useCity()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [district, setDistrict] = useState<DistrictOption | null>(storedDistrict)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)

  useEffect(() => {
    setDistrict(storedDistrict)
  }, [storedDistrict])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (district?.slug) params.set('district', district.slug)
    fetch(`/api/places?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('Не удалось загрузить места')
        setLoading(false)
      })
  }, [district])

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
    setSheetOpen(true)
  }

  const handleDistrictSelect = (d: DistrictOption | null) => {
    setDistrict(d)
    changeDistrict(d)
    setShowDistrictDropdown(false)
  }

  return (
    <div className="relative ec-page" style={{ height: 'calc(100vh - 56px)' }}>
      {/* District filter chip */}
      {districts.length > 0 && (
        <div className="absolute top-4 left-4 right-4 md:right-auto z-20">
          <div className="relative inline-block">
            <button
              onClick={() => setShowDistrictDropdown((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                district
                  ? 'ec-accent-bg'
                  : 'ec-chip'
              }`}
            >
              {district ? district.name : 'Район'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDistrictDropdown && (
              <div className="ec-surface absolute top-full left-0 mt-1 w-56 rounded-2xl py-1 max-h-60 overflow-y-auto">
                <button
                  onClick={() => handleDistrictSelect(null)}
                  className={`w-full text-left px-3 py-2 text-sm ${!district ? 'ec-accent-text bg-[color:var(--ec-surface-muted)] font-medium' : 'text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]'}`}
                >
                  Все районы
                </button>
                {districts.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => handleDistrictSelect(d)}
                    className={`w-full text-left px-3 py-2 text-sm ${district?.slug === d.slug ? 'ec-accent-text bg-[color:var(--ec-surface-muted)] font-medium' : 'text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]'}`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-screen map */}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-[color:var(--ec-surface-muted)]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[color:var(--ec-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm ec-muted">Загрузка карты...</p>
          </div>
        </div>
      ) : (
        <YandexMap
          places={places}
          onPlaceClick={handlePlaceClick}
          onMapClick={() => {}}
          height="100%"
        />
      )}

      {/* Mobile: bottom sheet with place list */}
      <MapBottomSheet
        places={places}
        selectedPlace={selectedPlace}
        onPlaceSelect={handlePlaceClick}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Desktop: sidebar */}
      <div className="hidden md:block ec-surface absolute top-16 left-4 w-80 max-h-[calc(100vh-160px)] overflow-y-auto rounded-2xl">
        <div className="p-4">
          <h2 className="font-semibold text-[color:var(--ec-text)] mb-3">Места ({places.length})</h2>
          <div className="space-y-2">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => handlePlaceClick(place)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedPlace?.id === place.id
                    ? 'bg-[color:var(--ec-surface-muted)] border ec-line'
                    : 'hover:bg-[color:var(--ec-surface-muted)] border border-transparent'
                }`}
              >
                <h4 className="font-medium text-sm text-[color:var(--ec-text)]">{place.name}</h4>
                {place.addressLine1 && (
                  <p className="text-xs ec-muted mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {place.addressLine1}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected place info — desktop */}
      {selectedPlace && (
        <div className="hidden md:block ec-surface absolute bottom-4 left-4 right-4 max-w-sm rounded-2xl p-4">
          <Link href={`/places/${selectedPlace.id}`} className="block">
            <h3 className="font-semibold text-[color:var(--ec-text)]">{selectedPlace.name}</h3>
            {selectedPlace.addressLine1 && (
              <p className="text-sm ec-muted mt-1">{selectedPlace.addressLine1}</p>
            )}
            <span className="text-sm ec-accent-text font-medium mt-2 inline-block">
              Подробнее &rarr;
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
