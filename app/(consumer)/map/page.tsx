'use client'

import { useState, useEffect } from 'react'
import YandexMap from '@/components/YandexMap'
import { MapBottomSheet } from '@/components/MapBottomSheet'
import { toast } from 'sonner'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface Place {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  addressLine1?: string | null
  placeType?: string | null
}

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [sheetOpen, setSheetOpen] = useState(true)

  useEffect(() => {
    fetch('/api/places')
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('Не удалось загрузить места')
        setLoading(false)
      })
  }, [])

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
    setSheetOpen(true)
  }

  return (
    <div className="relative" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Full-screen map */}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Загрузка карты...</p>
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
      <div className="hidden md:block absolute top-4 left-4 w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-xl shadow-lg">
        <div className="p-4">
          <h2 className="font-bold text-gray-900 mb-3">Места ({places.length})</h2>
          <div className="space-y-2">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => handlePlaceClick(place)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedPlace?.id === place.id
                    ? 'bg-brand-50 border border-brand-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <h4 className="font-medium text-sm">{place.name}</h4>
                {place.addressLine1 && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
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
        <div className="hidden md:block absolute bottom-4 left-4 right-4 max-w-sm bg-white rounded-xl shadow-lg p-4">
          <Link href={`/places/${selectedPlace.id}`} className="block">
            <h3 className="font-semibold text-gray-900">{selectedPlace.name}</h3>
            {selectedPlace.addressLine1 && (
              <p className="text-sm text-gray-500 mt-1">{selectedPlace.addressLine1}</p>
            )}
            <span className="text-sm text-brand-600 font-medium mt-2 inline-block">
              Подробнее &rarr;
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
