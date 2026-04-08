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
  const [loadError, setLoadError] = useState(false)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''

    // If no API key, show fallback immediately
    if (!apiKey) {
      setLoadError(true)
      return
    }

    // Already loaded from a previous mount
    if (window.ymaps) {
      try {
        window.ymaps.ready(() => setIsLoaded(true))
      } catch {
        setLoadError(true)
      }
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true

    // Hard timeout — if API doesn't load within 8s, show fallback
    const timeout = setTimeout(() => {
      setLoadError(true)
    }, 8000)

    script.onload = () => {
      try {
        window.ymaps.ready(() => {
          clearTimeout(timeout)
          setIsLoaded(true)
        })
      } catch {
        clearTimeout(timeout)
        setLoadError(true)
      }
    }
    script.onerror = () => {
      clearTimeout(timeout)
      setLoadError(true)
    }
    document.head.appendChild(script)

    return () => {
      clearTimeout(timeout)
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

  if (loadError) {
    return (
      <div
        style={{ height, width: '100%' }}
        className="bg-gray-100 rounded-lg flex items-center justify-center"
      >
        <div className="text-center p-8">
          <div className="text-4xl mb-3">&#x1F5FA;&#xFE0F;</div>
          <p className="text-gray-600 font-medium mb-1">Карта временно недоступна</p>
          <p className="text-gray-400 text-sm">Не удалось загрузить Yandex Maps. Попробуйте позже.</p>
        </div>
      </div>
    )
  }

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
