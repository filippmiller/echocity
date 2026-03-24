'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Place {
  id: string
  title: string
  address: string
  lat: number | null
  lng: number | null
  merchant: { name: string }
}

export default function MiniAppMapPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/places?limit=50')
      .then((r) => r.json())
      .then((d) => setPlaces(d.places || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white z-40 px-4 py-3 border-b">
        <h1 className="text-lg font-bold">Карта скидок</h1>
      </header>

      <div className="p-4 space-y-3">
        {loading && <div className="text-center py-12 text-gray-400">Загрузка...</div>}

        <p className="text-sm text-gray-500 mb-4">
          {places.length} мест с активными скидками
        </p>

        {places.map((place) => (
          <Link
            key={place.id}
            href={`/places/${place.id}`}
            className="block bg-white border rounded-xl p-4 hover:shadow-sm"
          >
            <p className="font-semibold text-sm">{place.title}</p>
            <p className="text-xs text-gray-400 mt-1">{place.address}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
