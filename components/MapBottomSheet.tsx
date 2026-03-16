'use client'

import { Drawer } from 'vaul'
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

export function MapBottomSheet({
  places,
  selectedPlace,
  onPlaceSelect,
  open,
  onOpenChange,
}: {
  places: Place[]
  selectedPlace: Place | null
  onPlaceSelect: (place: Place) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      snapPoints={[0.25, 0.5, 1]}
      activeSnapPoint={0.25}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-40 flex flex-col bg-white rounded-t-2xl md:hidden"
          style={{ maxHeight: '85vh' }}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-gray-300 my-3" />

          {/* Selected place detail */}
          {selectedPlace && (
            <div className="px-4 pb-3 border-b border-gray-100">
              <Link href={`/places/${selectedPlace.id}`} className="block">
                <h3 className="font-semibold text-gray-900">{selectedPlace.name}</h3>
                {selectedPlace.addressLine1 && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedPlace.addressLine1}
                  </p>
                )}
                {selectedPlace.placeType && (
                  <span className="inline-block mt-1.5 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full badge">
                    {selectedPlace.placeType}
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* Place list */}
          <div className="flex-1 overflow-y-auto px-4 py-2 pb-safe">
            <p className="text-xs text-gray-400 mb-2">{places.length} мест на карте</p>
            <div className="space-y-2">
              {places.map((place) => (
                <button
                  key={place.id}
                  onClick={() => onPlaceSelect(place)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    selectedPlace?.id === place.id
                      ? 'bg-brand-50 border border-brand-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <h4 className="font-medium text-sm text-gray-900">{place.name}</h4>
                  {place.addressLine1 && (
                    <p className="text-xs text-gray-500 mt-0.5">{place.addressLine1}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
