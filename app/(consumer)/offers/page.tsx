'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { OfferFeed } from '@/components/OfferFeed'
import { WhatsHot } from '@/components/WhatsHot'
import { TrendingDemands } from '@/components/TrendingDemands'
import { ForYouOffers } from '@/components/ForYouOffers'
import { HomeStoriesBar } from '@/components/HomeStoriesBar'
import { FeaturedCollections } from '@/components/FeaturedCollections'
import { TopRatedOffers } from '@/components/TopRatedOffers'
import { PullToRefresh } from '@/components/PullToRefresh'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { NearbyOffers } from '@/components/NearbyOffers'
import { CollapsibleSection } from '@/components/CollapsibleSection'
import { TimeOfDayCollections } from '@/components/TimeOfDayCollections'
import { StreakWidget } from '@/components/StreakWidget'
import { useCompare, CompareBar } from '@/components/OfferCompare'
import { useCity } from '@/components/CitySelector'

const FILTER_CHIPS = [
  { key: 'all', label: 'Все' },
  { key: 'nearby', label: '📍 Рядом' },
  { key: 'FREE_FOR_ALL', label: 'Бесплатные' },
  { key: 'MEMBERS_ONLY', label: 'Plus' },
  { key: 'activeNow', label: '🟢 Сейчас' },
]

const BENEFIT_TYPES = [
  { key: 'PERCENT', label: 'Скидка %' },
  { key: 'FIXED_AMOUNT', label: 'Сумма ₽' },
  { key: 'FIXED_PRICE', label: 'Цена ₽' },
  { key: 'FREE_ITEM', label: 'Подарок' },
  { key: 'BUNDLE', label: 'Комплект' },
  { key: 'MYSTERY_BAG', label: 'Сюрприз' },
]

const SORT_OPTIONS = [
  { key: 'recommended', label: 'Рекомендуемые' },
  { key: 'newest', label: 'Сначала новые' },
  { key: 'endingSoon', label: 'Скоро закончатся' },
  { key: 'nearest', label: 'Сначала близкие' },
  { key: 'rating', label: 'По рейтингу' },
]

/** Russian numeral agreement: 1 предложение, 2 предложения, 5 предложений */
function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const lastDigit = abs % 10
  if (abs > 10 && abs < 20) return many
  if (lastDigit === 1) return one
  if (lastDigit >= 2 && lastDigit <= 4) return few
  return many
}

const METRO_STATIONS = [
  'Невский проспект',
  'Гостиный двор',
  'Адмиралтейская',
  'Сенная площадь',
  'Василеостровская',
  'Петроградская',
  'Чернышевская',
  'Площадь Восстания',
  'Маяковская',
  'Технологический институт',
  'Звёздная',
  'Московская',
  'Пионерская',
  'Чёрная речка',
  'Озерки',
]

const CATEGORIES = [
  { slug: 'all', label: 'Все', emoji: '🔥' },
  { slug: 'coffee', label: 'Кофе', emoji: '☕' },
  { slug: 'food', label: 'Еда', emoji: '🍔' },
  { slug: 'bars', label: 'Бары', emoji: '🍺' },
  { slug: 'beauty', label: 'Красота', emoji: '💆' },
  { slug: 'nails', label: 'Ногти', emoji: '💅' },
  { slug: 'hair', label: 'Волосы', emoji: '💇' },
  { slug: 'laundry', label: 'Прачечная', emoji: '👔' },
  { slug: 'other', label: 'Другое', emoji: '🏪' },
  { slug: 'surprise', label: 'Сюрприз', emoji: '🎁' },
]

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <OffersContent />
    </Suspense>
  )
}

function CityLabel() {
  const { city } = useCity()
  return (
    <div className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shrink-0 flex items-center gap-1.5">
      <span>📍</span>
      {city}
    </div>
  )
}

interface FilterState {
  section: string
  category: string
  activeNow: boolean
  benefitType: string
  metro: string
  district: string
  showNearby: boolean
  sort: SortKey
}

type SortKey = typeof SORT_OPTIONS[number]['key']

function buildSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.section !== 'all') params.set('visibility', filters.section)
  if (filters.category !== 'all') params.set('category', filters.category)
  if (filters.activeNow) params.set('activeNow', 'true')
  if (filters.benefitType) params.set('benefitType', filters.benefitType)
  if (filters.metro) params.set('metro', filters.metro)
  if (filters.district) params.set('district', filters.district)
  if (filters.sort !== 'recommended') params.set('sort', filters.sort)
  return params
}

const RECENT_FILTERS_KEY = 'echocity_recent_offers_filters'

interface RecentFilters {
  params: string
  city: string
  appliedAt: string
}

function isDefaultFilters(filters: FilterState): boolean {
  return (
    filters.section === 'all' &&
    filters.category === 'all' &&
    !filters.activeNow &&
    !filters.benefitType &&
    !filters.metro &&
    !filters.district &&
    filters.sort === 'recommended'
  )
}

function hasUrlFilterParams(params: URLSearchParams): boolean {
  return (
    params.has('visibility') ||
    params.has('category') ||
    params.has('activeNow') ||
    params.has('benefitType') ||
    params.has('metro') ||
    params.has('district')
  )
}

function saveRecentFilters(filters: FilterState, city: string): void {
  try {
    if (isDefaultFilters(filters)) return
    const params = buildSearchParams(filters).toString()
    if (!params) return
    const recent: RecentFilters = {
      params,
      city,
      appliedAt: new Date().toISOString(),
    }
    localStorage.setItem(RECENT_FILTERS_KEY, JSON.stringify(recent))
  } catch {
    // localStorage is unavailable or full — ignore
  }
}

function loadRecentFilters(): RecentFilters | null {
  try {
    const raw = localStorage.getItem(RECENT_FILTERS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.params !== 'string' || typeof parsed.city !== 'string') return null
    return parsed as RecentFilters
  } catch {
    return null
  }
}

function OffersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const compare = useCompare()
  const { city, districts, district: selectedDistrict } = useCity()
  const [showMetroDropdown, setShowMetroDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [recentFilters, setRecentFilters] = useState<RecentFilters | null>(null)

  const initialFilters = useMemo<FilterState>(() => ({
    section: searchParams.get('visibility') || 'all',
    category: searchParams.get('category') || 'all',
    activeNow: searchParams.get('activeNow') === 'true',
    benefitType: searchParams.get('benefitType') || '',
    metro: searchParams.get('metro') || '',
    district: searchParams.get('district') || '',
    showNearby: false,
    sort: (searchParams.get('sort') as SortKey) || 'recommended',
  }), [])

  const [filters, setFilters] = useState<FilterState>(initialFilters)

  // Sync filter state with URL search params when the user navigates back/forward
  useEffect(() => {
    const next: FilterState = {
      section: searchParams.get('visibility') || 'all',
      category: searchParams.get('category') || 'all',
      activeNow: searchParams.get('activeNow') === 'true',
      benefitType: searchParams.get('benefitType') || '',
      metro: searchParams.get('metro') || '',
      district: searchParams.get('district') || '',
      showNearby: filters.showNearby,
      sort: (searchParams.get('sort') as SortKey) || 'recommended',
    }
    if (
      next.section !== filters.section ||
      next.category !== filters.category ||
      next.activeNow !== filters.activeNow ||
      next.benefitType !== filters.benefitType ||
      next.metro !== filters.metro ||
      next.district !== filters.district ||
      next.sort !== filters.sort
    ) {
      setFilters(next)
    }
  }, [searchParams])

  // Load recent filters from localStorage; URL params always take precedence
  useEffect(() => {
    if (hasUrlFilterParams(searchParams)) {
      setRecentFilters(null)
      return
    }
    const recent = loadRecentFilters()
    if (!recent) {
      setRecentFilters(null)
      return
    }
    if (recent.city !== city) {
      const params = new URLSearchParams(recent.params)
      params.delete('district')
      params.delete('metro')
      if (params.toString()) {
        setRecentFilters({ ...recent, params: params.toString() })
      } else {
        setRecentFilters(null)
      }
    } else {
      setRecentFilters(recent)
    }
  }, [searchParams, city])

  const updateFilters = useCallback((update: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...update }
      const params = buildSearchParams(next)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      saveRecentFilters(next, city)
      return next
    })
  }, [pathname, router, city])

  const handleRefresh = useCallback(async () => {
    // Bump the key so OfferFeed re-mounts and re-fetches
    setRefreshKey((k) => k + 1)
    // Brief delay so the animation feels satisfying
    await new Promise((resolve) => setTimeout(resolve, 600))
  }, [])

  // Fetch category counts when city changes
  useEffect(() => {
    fetch(`/api/offers/counts?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((data) => setCategoryCounts(data.counts || {}))
      .catch(() => {})
  }, [city])

  const { section, category, activeNow, benefitType, metro, district, showNearby, sort } = filters



  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Скидки в {city}</h1>
              <p className="text-blue-100 text-sm">
                {categoryCounts.all > 0
                  ? `${categoryCounts.all} ${plural(categoryCounts.all, 'активное предложение', 'активных предложения', 'активных предложений')}`
                  : 'Актуальные предложения поблизости'}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <StreakWidget />
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <CityLabel />

            <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto hide-scrollbar">
              {FILTER_CHIPS.map((chip) => {
                const isActiveNowChip = chip.key === 'activeNow'
                const isNearbyChip = chip.key === 'nearby'
                const isSelected = isNearbyChip
                  ? showNearby
                  : isActiveNowChip
                    ? activeNow
                    : section === chip.key
                return (
                  <button
                    key={chip.key}
                    onClick={() => {
                      if (isNearbyChip) {
                        updateFilters({ showNearby: !showNearby })
                      } else if (isActiveNowChip) {
                        updateFilters({ activeNow: !activeNow })
                      } else {
                        updateFilters({
                          section: chip.key,
                          activeNow: false,
                          showNearby: false,
                          benefitType: '',
                        })
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors chip ${
                      isSelected
                        ? isNearbyChip
                          ? 'bg-blue-500 text-white'
                          : isActiveNowChip
                            ? 'bg-green-500 text-white'
                            : 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>

            <label className="sr-only" htmlFor="offers-sort">Сортировка</label>
            <select
              id="offers-sort"
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value as SortKey })}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Repeat last search affordance */}
          {recentFilters && (
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => router.replace(`${pathname}?${recentFilters.params}`, { scroll: false })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-brand-100 text-brand-700 border border-brand-200 active:bg-brand-200 chip shrink-0"
              >
                <span>↻</span>
                Повторить последний поиск
              </button>
            </div>
          )}

          {/* Active filter pills */}
          {(section !== 'all' || category !== 'all' || activeNow || benefitType || metro || district || sort !== 'recommended') && (
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <span className="text-xs text-gray-400 shrink-0">Активные:</span>
              {section !== 'all' && section !== 'activeNow' && (
                <button
                  onClick={() => updateFilters({ section: 'all' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-brand-100 text-brand-700 border border-brand-200 active:bg-brand-200 chip shrink-0"
                >
                  {section === 'FREE_FOR_ALL' ? 'Бесплатные' : section === 'MEMBERS_ONLY' ? 'Plus' : 'Рядом'}
                  <span className="text-brand-900">×</span>
                </button>
              )}
              {activeNow && (
                <button
                  onClick={() => updateFilters({ activeNow: false })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-green-100 text-green-700 border border-green-200 active:bg-green-200 chip shrink-0"
                >
                  Сейчас
                  <span className="text-green-900">×</span>
                </button>
              )}
              {category !== 'all' && (
                <button
                  onClick={() => updateFilters({ category: 'all' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-gray-900 text-white active:bg-gray-800 chip shrink-0"
                >
                  {CATEGORIES.find((c) => c.slug === category)?.label || category}
                  <span>×</span>
                </button>
              )}
              {benefitType && (
                <button
                  onClick={() => updateFilters({ benefitType: '' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-emerald-100 text-emerald-700 border border-emerald-200 active:bg-emerald-200 chip shrink-0"
                >
                  {BENEFIT_TYPES.find((bt) => bt.key === benefitType)?.label || benefitType}
                  <span className="text-emerald-900">×</span>
                </button>
              )}
              {metro && (
                <button
                  onClick={() => updateFilters({ metro: '' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-700 border border-blue-200 active:bg-blue-200 chip shrink-0"
                >
                  м. {metro}
                  <span className="text-blue-900">×</span>
                </button>
              )}
              {district && (
                <button
                  onClick={() => updateFilters({ district: '' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-emerald-100 text-emerald-700 border border-emerald-200 active:bg-emerald-200 chip shrink-0"
                >
                  {selectedDistrict?.name || district}
                  <span className="text-emerald-900">×</span>
                </button>
              )}
              {sort !== 'recommended' && (
                <button
                  onClick={() => updateFilters({ sort: 'recommended' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-purple-100 text-purple-700 border border-purple-200 active:bg-purple-200 chip shrink-0"
                >
                  {SORT_OPTIONS.find((s) => s.key === sort)?.label || sort}
                  <span className="text-purple-900">×</span>
                </button>
              )}
              {!isDefaultFilters(filters) && (
                <button
                  onClick={() => updateFilters({ section: 'all', category: 'all', activeNow: false, benefitType: '', metro: '', district: '', sort: 'recommended' })}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap shrink-0 px-1"
                >
                  Сбросить всё
                </button>
              )}
            </div>
          )}

          {/* Category pills with live counts */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.slug]
              return (
                <button
                  key={cat.slug}
                  onClick={() => updateFilters({ category: cat.slug })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors chip ${
                    category === cat.slug
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 active:bg-gray-100'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                  {count !== undefined && count > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      category === cat.slug ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Benefit type filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {BENEFIT_TYPES.map((bt) => (
              <button
                key={bt.key}
                onClick={() => updateFilters({ benefitType: benefitType === bt.key ? '' : bt.key })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors chip ${
                  benefitType === bt.key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 active:bg-gray-100'
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>

          {/* Metro filter */}
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setShowMetroDropdown((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors chip shrink-0 ${
                  metro
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 active:bg-gray-100'
                }`}
              >
                <span>🚇</span>
                {metro ? `м. ${metro}` : 'Метро'}
              </button>

              {metro && (
                <button
                  onClick={() => updateFilters({ metro: '' })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-500 active:bg-gray-200 chip shrink-0"
                >
                  Сбросить метро
                </button>
              )}
            </div>

            {showMetroDropdown && (
              <div className="absolute top-full left-0 mt-1 z-40 bg-white rounded-xl shadow-lg border border-gray-100 p-2 w-64 max-h-60 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {METRO_STATIONS.map((station) => (
                    <button
                      key={station}
                      onClick={() => {
                        updateFilters({ metro: station === metro ? '' : station })
                        setShowMetroDropdown(false)
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors chip ${
                        metro === station
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                      }`}
                    >
                      {station}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* District filter */}
          {districts.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setShowDistrictDropdown((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors chip shrink-0 ${
                    district
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 active:bg-gray-100'
                  }`}
                >
                  <span>🏘️</span>
                  {district ? selectedDistrict?.name || district : 'Район'}
                </button>

                {district && (
                  <button
                    onClick={() => updateFilters({ district: '' })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-500 active:bg-gray-200 chip shrink-0"
                  >
                    Сбросить район
                  </button>
                )}
              </div>

              {showDistrictDropdown && (
                <div className="absolute top-full left-0 mt-1 z-40 bg-white rounded-xl shadow-lg border border-gray-100 p-2 w-64 max-h-60 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {districts.map((d) => (
                      <button
                        key={d.slug}
                        onClick={() => {
                          updateFilters({ district: d.slug === district ? '' : d.slug })
                          setShowDistrictDropdown(false)
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors chip ${
                          district === d.slug
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feed with pull-to-refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {showNearby && <NearbyOffers city={city} />}
            <RecentlyViewed />
            <HomeStoriesBar />
            <WhatsHot city={city} />
            {!showNearby && <NearbyOffers city={city} />}
            <ForYouOffers city={city} />
            <CollapsibleSection id="top-rated">
              <TopRatedOffers city={city} />
            </CollapsibleSection>
            <CollapsibleSection id="collections">
              <FeaturedCollections />
            </CollapsibleSection>
            <CollapsibleSection id="demands">
              <TrendingDemands city={city} />
            </CollapsibleSection>
            <CollapsibleSection id="time-of-day">
              <TimeOfDayCollections />
            </CollapsibleSection>
            <OfferFeed
              key={refreshKey}
              city={city}
              visibility={section === 'all' || section === 'activeNow' ? undefined : section}
              category={category === 'all' ? undefined : category}
              activeNow={activeNow}
              metro={metro || undefined}
              district={district || undefined}
              benefitType={benefitType || undefined}
              sort={sort}
              onClearFilters={() => updateFilters({ section: 'all', category: 'all', activeNow: false, benefitType: '', metro: '', district: '', sort: 'recommended' })}
            />
          </div>
        </div>
      </PullToRefresh>

      <CompareBar ids={compare.ids} onClear={compare.clear} />
    </div>
  )
}
