'use client'

import { useState, useEffect } from 'react'
import YandexMap from '@/components/YandexMap'
import { Plus, X } from 'lucide-react'

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
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    addressLine1: '',
    placeType: '',
  })
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null)

  useEffect(() => {
    loadPlaces()
  }, [])

  const loadPlaces = async () => {
    try {
      const res = await fetch('/api/places')
      if (res.ok) {
        const data = await res.json()
        setPlaces(data.places || [])
      }
    } catch (error) {
      console.error('Error loading places:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = (coordinates: [number, number]) => {
    setClickedCoords(coordinates)
    setShowAddForm(true)
    setFormData({
      name: '',
      addressLine1: '',
      placeType: '',
    })
    setGeocodeError(null)
    setGeocodedAddress(null)
  }

  const handleGeocodeAddress = async () => {
    if (!formData.addressLine1.trim()) {
      setGeocodeError('Введите адрес для проверки')
      return
    }

    setGeocoding(true)
    setGeocodeError(null)
    setGeocodedAddress(null)

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(formData.addressLine1)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при геокодировании')
      }

      // Update coordinates from geocoding result
      setClickedCoords([data.latitude, data.longitude])
      setGeocodedAddress(data.formattedAddress)
      
      // Optionally update the address field with formatted address
      if (data.formattedAddress && data.formattedAddress !== formData.addressLine1) {
        setFormData({ ...formData, addressLine1: data.formattedAddress })
      }
    } catch (error: any) {
      setGeocodeError(error.message || 'Ошибка при проверке адреса')
    } finally {
      setGeocoding(false)
    }
  }

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clickedCoords) return

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          latitude: clickedCoords[0],
          longitude: clickedCoords[1],
          addressLine1: formData.addressLine1 || null,
          placeType: formData.placeType || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPlaces([...places, data.place])
        setShowAddForm(false)
        setClickedCoords(null)
        setFormData({ name: '', addressLine1: '', placeType: '' })
      } else {
        const error = await res.json()
        alert(error.error || 'Ошибка при создании места')
      }
    } catch (error) {
      console.error('Error creating place:', error)
      alert('Ошибка при создании места')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Карта заведений</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить место
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Добавить новое место</h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setClickedCoords(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {clickedCoords
                ? `Координаты: ${clickedCoords[0].toFixed(6)}, ${clickedCoords[1].toFixed(6)}`
                : 'Нажмите на карту, чтобы выбрать местоположение'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Название заведения"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => {
                      setFormData({ ...formData, addressLine1: e.target.value })
                      setGeocodeError(null)
                      setGeocodedAddress(null)
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleGeocodeAddress()
                      }
                    }}
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите адрес и нажмите 'Проверить'"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={geocoding || !formData.addressLine1.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {geocoding ? 'Проверка...' : 'Проверить'}
                  </button>
                </div>
                {geocodeError && (
                  <p className="mt-1 text-sm text-red-600">{geocodeError}</p>
                )}
                {geocodedAddress && (
                  <p className="mt-1 text-sm text-green-600">
                    ✓ Адрес найден: {geocodedAddress}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип заведения
                </label>
                <input
                  type="text"
                  value={formData.placeType}
                  onChange={(e) => setFormData({ ...formData, placeType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Кафе, Ресторан, Магазин"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!clickedCoords || !formData.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Создать место
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setClickedCoords(null)
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedPlace && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedPlace.name}</h2>
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedPlace.addressLine1 && (
              <p className="text-gray-600 mb-2">📍 {selectedPlace.addressLine1}</p>
            )}
            {selectedPlace.placeType && (
              <p className="text-sm text-gray-500">Тип: {selectedPlace.placeType}</p>
            )}
            {selectedPlace.latitude && selectedPlace.longitude && (
              <p className="text-xs text-gray-400 mt-2">
                Координаты: {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
              </p>
            )}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-gray-600">Загрузка карты...</p>
            </div>
          ) : (
            <YandexMap
              places={places}
              onPlaceClick={handlePlaceClick}
              onMapClick={handleMapClick}
              height="600px"
            />
          )}
        </div>

        {places.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Найдено мест: {places.length}
          </div>
        )}
      </div>
    </div>
  )
}
