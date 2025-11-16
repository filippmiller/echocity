'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Star, Filter } from 'lucide-react'
import Link from 'next/link'

interface Place {
  id: string
  name: string
  address: string
  city: string
  placeType: string
  averageRating?: number | null
  reviewCount?: number
  services?: Array<{
    name: string
    price?: string | number
  }>
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [cityId, setCityId] = useState('')
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([])
  const [serviceTypes, setServiceTypes] = useState<
    Array<{ id: string; name: string; categoryName: string }>
  >([])

  useEffect(() => {
    // Load cities and service types for filters
    Promise.all([
      fetch('/api/public/cities')
        .then((res) => res.json())
        .then((data) => setCities(data.cities || []))
        .catch(() => {}),
      fetch('/api/public/service-types')
        .then((res) => res.json())
        .then((data) => setServiceTypes(data.serviceTypes || []))
        .catch(() => {}),
    ])
  }, [])

  const handleSearch = async () => {
    if (!query.trim() && !serviceTypeId) {
      setError('Введите запрос или выберите услугу')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.append('q', query.trim())
      if (cityId) params.append('cityId', cityId)
      if (serviceTypeId) params.append('serviceTypeId', serviceTypeId)

      const response = await fetch(`/api/public/search?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при поиске')
      }

      setPlaces(data.places || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при поиске')
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Поиск заведений</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск по названию или описанию
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Например: кафе, парикмахерская, химчистка..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Поиск...' : 'Найти'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Город
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все города</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Услуга
                </label>
                <select
                  value={serviceTypeId}
                  onChange={(e) => setServiceTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все услуги</option>
                  {serviceTypes.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.categoryName} → {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Поиск...</p>
          </div>
        ) : places.length === 0 && (query || serviceTypeId) ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Ничего не найдено</p>
          </div>
        ) : (
          <div className="space-y-4">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/places/${place.id}`}
                className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {place.city}, {place.address}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {place.placeType}
                      </span>
                    </div>
                    {place.averageRating !== null && place.averageRating !== undefined && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {place.averageRating.toFixed(1)}
                        </span>
                        {place.reviewCount !== undefined && (
                          <span className="text-gray-500">
                            ({place.reviewCount} отзывов)
                          </span>
                        )}
                      </div>
                    )}
                    {place.services && place.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {place.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {service.name}
                            {service.price && ` от ${service.price} ₽`}
                          </span>
                        ))}
                        {place.services.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{place.services.length - 3} еще
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


