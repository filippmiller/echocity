'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    ymaps: any
  }
}

interface Place {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  addressLine1?: string | null
  placeType?: string | null
}

interface YandexMapProps {
  places: Place[]
  onPlaceClick?: (place: Place) => void
  onMapClick?: (coordinates: [number, number]) => void
  center?: [number, number]
  zoom?: number
  height?: string
}

export default function YandexMap({
  places,
  onPlaceClick,
  onMapClick,
  center = [59.9343, 30.3351], // Санкт-Петербург по умолчанию
  zoom = 12,
  height = '600px',
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    // Load Yandex Maps API 2.1
    if (window.ymaps) {
      window.ymaps.ready(() => setIsLoaded(true))
      return
    }

    const script = document.createElement('script')
    // API key can be set via NEXT_PUBLIC_YANDEX_MAPS_API_KEY env variable
    // For development, can work without key (with limitations)
    // Next.js will replace this at build time
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true
    script.onload = () => {
      window.ymaps.ready(() => {
        setIsLoaded(true)
      })
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    window.ymaps.ready(() => {
      if (mapInstance) {
        mapInstance.destroy()
      }

      const map = new window.ymaps.Map(mapRef.current!, {
        center,
        zoom,
        controls: ['zoomControl', 'fullscreenControl'],
      })

      // Handle map click
      if (onMapClick) {
        map.events.add('click', (e: any) => {
          const coords = e.get('coords')
          onMapClick([coords[0], coords[1]]) // [lat, lon]
        })
      }

      setMapInstance(map)
    })
  }, [isLoaded, center, zoom, onMapClick])

  useEffect(() => {
    if (!mapInstance || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstance.geoObjects.remove(marker)
    })
    markersRef.current = []

    // Add markers for places
    places.forEach((place) => {
      if (!place.latitude || !place.longitude) return

      const marker = new window.ymaps.Placemark(
        [place.latitude, place.longitude],
        {
          balloonContent: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600;">${place.name}</h3>
              ${place.addressLine1 ? `<p style="margin: 0; color: #666;">${place.addressLine1}</p>` : ''}
              ${place.placeType ? `<p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">${place.placeType}</p>` : ''}
            </div>
          `,
          iconCaption: place.name,
        },
        {
          preset: 'islands#blueDotIconWithCaption',
        }
      )

      if (onPlaceClick) {
        marker.events.add('click', () => {
          onPlaceClick(place)
        })
      }

      mapInstance.geoObjects.add(marker)
      markersRef.current.push(marker)
    })
  }, [mapInstance, places, onPlaceClick, isLoaded])

  if (!isLoaded) {
    return (
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="bg-gray-200 rounded-lg flex items-center justify-center"
      >
        <p className="text-gray-600">Загрузка карты...</p>
      </div>
    )
  }

  return <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg" />
}
