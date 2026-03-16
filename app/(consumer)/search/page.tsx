'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Star, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Place {
  id: string
  name: string
  address: string
  city: string
  placeType: string
  averageRating?: number | null
  reviewCount?: number
  services?: Array<{ name: string; price?: string | number }>
}

const RECENT_SEARCHES_KEY = 'echocity_recent_searches'

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  const searches = getRecentSearches().filter((s) => s !== query)
  searches.unshift(query)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 7)))
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRecentSearches(getRecentSearches())
    inputRef.current?.focus()
  }, [])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setLoading(true)
    setHasSearched(true)
    addRecentSearch(q.trim())
    setRecentSearches(getRecentSearches())

    try {
      const params = new URLSearchParams({ q: q.trim() })
      const response = await fetch(`/api/public/search?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setPlaces(data.places || [])
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при поиске')
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Search header */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="md:hidden p-1 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Кафе, парикмахерская, химчистка..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white border border-transparent focus:border-brand-200"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 text-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 shrink-0"
          >
            Найти
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Recent searches */}
        {!hasSearched && recentSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Недавние</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleSearch(s) }}
                  className="px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-gray-200 chip"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            {places.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Ничего не найдено</p>
                <p className="text-sm text-gray-400 mt-1">Попробуйте изменить запрос</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">{places.length} результатов</p>
                {places.map((place) => (
                  <Link
                    key={place.id}
                    href={`/places/${place.id}`}
                    className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 active:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">{place.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {place.city}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs badge">
                        {place.placeType}
                      </span>
                      {place.averageRating != null && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {place.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {place.services && place.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {place.services.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full badge">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
