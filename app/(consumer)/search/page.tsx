'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Star, ArrowLeft, X, Tag } from 'lucide-react'
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
}

interface OfferResult {
  id: string
  title: string
  subtitle?: string | null
  benefitType: string
  benefitValue: number
  visibility: string
  imageUrl?: string | null
  offerType: string
  branchTitle?: string | null
  branchAddress?: string | null
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

function formatBenefit(type: string, value: number): string {
  if (type === 'PERCENT') return `-${value}%`
  if (type === 'FIXED') return `-${value} ₽`
  if (type === 'GIFT') return 'Подарок'
  return `${value}`
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [offers, setOffers] = useState<OfferResult[]>([])
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
      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setPlaces(data.places || [])
      setOffers(data.offers || [])
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при поиске')
      setPlaces([])
      setOffers([])
    } finally {
      setLoading(false)
    }
  }

  const totalResults = places.length + offers.length

  return (
    <div className="ec-page min-h-screen">
      {/* Search header */}
      <div className="sticky top-14 z-30 border-b ec-line bg-[color:var(--ec-bg)]/95 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/" className="md:hidden p-1 ec-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ec-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Кафе, парикмахерская, скидка на кофе..."
              className="ec-field w-full pl-10 pr-10 py-2.5 text-sm focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 ec-muted hover:text-[color:var(--ec-text)] text-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="ec-button px-4 py-2.5 text-sm disabled:opacity-50 shrink-0"
          >
            Найти
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Quick search suggestions */}
        {!hasSearched && (
          <div className="mb-6">
            <h3 className="text-sm font-medium ec-muted mb-2">Популярные запросы</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {['☕ Кофе', '🍔 Бургеры', '💅 Маникюр', '💇 Стрижка', '🍺 Крафтовое пиво', '👔 Химчистка', '🍕 Пицца', '🧖 СПА'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s.slice(2).trim()); handleSearch(s.slice(2).trim()) }}
                  className="ec-chip px-3 py-1.5 text-sm chip"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent searches */}
        {!hasSearched && recentSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium ec-muted mb-2">Недавние</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleSearch(s) }}
                  className="ec-chip px-3 py-1.5 text-sm chip"
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
            {totalResults === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-[color:var(--ec-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 ec-muted" />
                </div>
                <p className="ec-muted font-medium">Ничего не найдено</p>
                <p className="text-sm ec-muted mt-1">Попробуйте изменить запрос</p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs ec-muted">{totalResults} результатов</p>

                {/* Offers section — shown first */}
                {offers.length > 0 && (
                  <div>
                    <h2 className="text-[11px] font-semibold ec-muted uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      Скидки
                    </h2>
                    <div className="space-y-2.5">
                      {offers.map((offer) => (
                        <Link
                          key={offer.id}
                          href={`/offers/${offer.id}`}
                          className="flex items-start gap-3 ec-row rounded-xl p-4 transition-colors"
                        >
                          {/* Benefit badge */}
                          <div className="shrink-0 mt-0.5 px-2.5 py-1.5 ec-accent-bg text-sm font-bold rounded-lg min-w-[52px] text-center">
                            {formatBenefit(offer.benefitType, offer.benefitValue)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[color:var(--ec-text)] text-sm leading-snug truncate">
                              {offer.title}
                            </h3>
                            {offer.subtitle && (
                              <p className="text-xs ec-muted mt-0.5 truncate">{offer.subtitle}</p>
                            )}
                            {offer.branchTitle && (
                              <div className="flex items-center gap-1 mt-1.5 text-xs ec-muted">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{offer.branchTitle}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Places section */}
                {places.length > 0 && (
                  <div>
                    <h2 className="text-[11px] font-semibold ec-muted uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      Заведения
                    </h2>
                    <div className="space-y-2.5">
                      {places.map((place) => (
                        <Link
                          key={place.id}
                          href={`/places/${place.id}`}
                          className="block ec-row rounded-xl p-4 transition-colors"
                        >
                          <h3 className="font-semibold text-[color:var(--ec-text)]">{place.name}</h3>
                          <div className="flex items-center gap-3 mt-1.5 text-sm ec-muted">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {place.city}
                            </span>
                            <span className="ec-chip px-2 py-0.5 text-xs badge">
                              {place.placeType}
                            </span>
                            {place.averageRating != null && (
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {place.averageRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
