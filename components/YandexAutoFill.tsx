'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, Phone, ChevronRight, X, Loader2 } from 'lucide-react'

export interface YandexPlaceResult {
  id: string
  name: string
  address: string
  phones: string[]
  coordinates?: { lat: number; lng: number }
}

export interface YandexAutoFillData {
  name: string
  address: string
  phone: string
  lat?: number
  lng?: number
  businessType: string
}

interface YandexAutoFillProps {
  onSelect: (data: YandexAutoFillData) => void
  onSkip: () => void
}

const BUSINESS_TYPE_KEYWORDS: Record<string, string> = {
  кафе: 'CAFE',
  кофе: 'CAFE',
  coffee: 'CAFE',
  cafe: 'CAFE',
  ресторан: 'RESTAURANT',
  restaurant: 'RESTAURANT',
  бар: 'BAR',
  bar: 'BAR',
  паб: 'BAR',
  pub: 'BAR',
  красота: 'BEAUTY',
  beauty: 'BEAUTY',
  салон: 'BEAUTY',
  маникюр: 'NAILS',
  nail: 'NAILS',
  парикмахер: 'HAIR',
  hair: 'HAIR',
  барбершоп: 'HAIR',
  barber: 'HAIR',
  химчист: 'DRYCLEANING',
}

function guessBusinessType(name: string, address: string): string {
  const text = (name + ' ' + address).toLowerCase()
  for (const [keyword, type] of Object.entries(BUSINESS_TYPE_KEYWORDS)) {
    if (text.includes(keyword)) return type
  }
  return 'CAFE'
}

export function YandexAutoFill({ onSelect, onSkip }: YandexAutoFillProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YandexPlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = async (text: string) => {
    if (!text.trim() || text.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/integrations/yandex/places/search?text=${encodeURIComponent(text.trim())}&limit=6`
      )
      const data = await res.json()

      if (res.status === 503) {
        // Yandex not configured — silently hide the block
        onSkip()
        return
      }

      if (!res.ok) {
        setError('Не удалось выполнить поиск. Попробуйте ввести данные вручную.')
        setResults([])
      } else {
        setResults(data.results || [])
        setSearched(true)
      }
    } catch {
      setError('Ошибка соединения. Попробуйте ввести данные вручную.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(value), 500)
  }

  const handleSelect = (place: YandexPlaceResult) => {
    const businessType = guessBusinessType(place.name, place.address)
    onSelect({
      name: place.name,
      address: place.address,
      phone: place.phones?.[0] || '',
      lat: place.coordinates?.lat,
      lng: place.coordinates?.lng,
      businessType,
    })
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
          <MapPin className="w-6 h-6 text-brand-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Найдите ваше заведение на Яндекс Картах
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Мы автоматически заполним форму — это займёт меньше минуты
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Название заведения или адрес..."
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
              setSearched(false)
              setError(null)
            }}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => handleSelect(place)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{place.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  </div>
                  {place.phones?.[0] && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500">{place.phones[0]}</p>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 shrink-0 mt-0.5 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {searched && results.length === 0 && !loading && !error && (
        <div className="text-center py-6 text-gray-500 text-sm">
          Ничего не найдено. Попробуйте другое название или заполните данные вручную.
        </div>
      )}

      {/* Skip link */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Или заполните вручную
        </button>
      </div>
    </div>
  )
}
