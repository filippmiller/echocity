'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OfferFeed } from '@/components/OfferFeed'
import { WhatsHot } from '@/components/WhatsHot'
import { TrendingDemands } from '@/components/TrendingDemands'
import { ForYouOffers } from '@/components/ForYouOffers'
import { HomeStoriesBar } from '@/components/HomeStoriesBar'
import { FeaturedCollections } from '@/components/FeaturedCollections'
import { TopRatedOffers } from '@/components/TopRatedOffers'
import { Footer } from '@/components/Footer'
import { PullToRefresh } from '@/components/PullToRefresh'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { NearbyOffers } from '@/components/NearbyOffers'

const FILTER_CHIPS = [
  { key: 'all', label: 'Все' },
  { key: 'FREE_FOR_ALL', label: 'Бесплатные' },
  { key: 'MEMBERS_ONLY', label: 'Plus' },
  { key: 'activeNow', label: '🟢 Сейчас' },
]

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
  { slug: 'all', label: 'Все категории', emoji: '🔥' },
  { slug: 'coffee', label: 'Кофе', emoji: '☕' },
  { slug: 'food', label: 'Еда', emoji: '🍔' },
  { slug: 'bars', label: 'Бары', emoji: '🍺' },
  { slug: 'beauty', label: 'Красота', emoji: '💅' },
  { slug: 'services', label: 'Услуги', emoji: '🔧' },
]

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <OffersContent />
    </Suspense>
  )
}

function OffersContent() {
  const searchParams = useSearchParams()
  const [availableCities, setAvailableCities] = useState<string[]>(['Санкт-Петербург', 'Москва'])
  const [city, setCity] = useState(searchParams.get('city') || 'Санкт-Петербург')
  const [section, setSection] = useState(searchParams.get('visibility') || 'all')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [activeNow, setActiveNow] = useState(searchParams.get('activeNow') === 'true')
  const [metro, setMetro] = useState(searchParams.get('metro') || '')
  const [showMetroDropdown, setShowMetroDropdown] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  const handleRefresh = useCallback(async () => {
    // Bump the key so OfferFeed re-mounts and re-fetches
    setRefreshKey((k) => k + 1)
    // Brief delay so the animation feels satisfying
    await new Promise((resolve) => setTimeout(resolve, 600))
  }, [])

  useEffect(() => {
    const nextCity = searchParams.get('city') || 'Санкт-Петербург'
    const nextSection = searchParams.get('visibility') || 'all'
    const nextCategory = searchParams.get('category') || 'all'
    const nextActiveNow = searchParams.get('activeNow') === 'true'
    const nextMetro = searchParams.get('metro') || ''
    setCity(nextCity)
    setSection(nextSection)
    setCategory(nextCategory)
    setActiveNow(nextActiveNow)
    setMetro(nextMetro)
  }, [searchParams])

  // Fetch category counts when city changes
  useEffect(() => {
    fetch(`/api/offers/counts?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((data) => setCategoryCounts(data.counts || {}))
      .catch(() => {})
  }, [city])

  useEffect(() => {
    fetch('/api/public/cities')
      .then((res) => res.json())
      .then((data) => {
        const cityNames = Array.isArray(data.cities)
          ? data.cities.map((item: { name: string }) => item.name).filter(Boolean)
          : []

        if (cityNames.length > 0) {
          setAvailableCities(cityNames)
          if (!cityNames.includes(city)) {
            setCity(cityNames[0])
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Скидки</h1>
          <p className="text-blue-100 text-sm">Все актуальные предложения в вашем городе</p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shrink-0"
            >
              {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {FILTER_CHIPS.map((chip) => {
                const isActiveNowChip = chip.key === 'activeNow'
                const isSelected = isActiveNowChip ? activeNow : section === chip.key
                return (
                  <button
                    key={chip.key}
                    onClick={() => {
                      if (isActiveNowChip) {
                        setActiveNow((prev) => !prev)
                      } else {
                        setSection(chip.key)
                        setActiveNow(false)
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors chip ${
                      isSelected
                        ? isActiveNowChip
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
          </div>

          {/* Category pills with live counts */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.slug]
              return (
                <button
                  key={cat.slug}
                  onClick={() => setCategory(cat.slug)}
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
                  onClick={() => setMetro('')}
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
                        setMetro(station === metro ? '' : station)
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
        </div>
      </div>

      {/* Feed with pull-to-refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <RecentlyViewed />
            <HomeStoriesBar />
            <WhatsHot city={city} />
            <NearbyOffers city={city} />
            <ForYouOffers city={city} />
            <TopRatedOffers city={city} />
            <FeaturedCollections />
            <TrendingDemands city={city} />
            <OfferFeed
              key={refreshKey}
              city={city}
              visibility={section === 'all' || section === 'activeNow' ? undefined : section}
              category={category === 'all' ? undefined : category}
              activeNow={activeNow}
              metro={metro || undefined}
            />
          </div>
        </div>
      </PullToRefresh>

      <Footer />
    </div>
  )
}
