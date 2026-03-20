'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OfferFeed } from '@/components/OfferFeed'
import { Footer } from '@/components/Footer'

const FILTER_CHIPS = [
  { key: 'all', label: 'Все' },
  { key: 'FREE_FOR_ALL', label: 'Бесплатные' },
  { key: 'MEMBERS_ONLY', label: 'Plus' },
  { key: 'activeNow', label: '🟢 Сейчас' },
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

  useEffect(() => {
    const nextCity = searchParams.get('city') || 'Санкт-Петербург'
    const nextSection = searchParams.get('visibility') || 'all'
    const nextCategory = searchParams.get('category') || 'all'
    const nextActiveNow = searchParams.get('activeNow') === 'true'
    setCity(nextCity)
    setSection(nextSection)
    setCategory(nextCategory)
    setActiveNow(nextActiveNow)
  }, [searchParams])

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

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map((cat) => (
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <OfferFeed
            city={city}
            visibility={section === 'all' || section === 'activeNow' ? undefined : section}
            category={category === 'all' ? undefined : category}
            activeNow={activeNow}
          />
        </div>
      </div>

      <Footer />
    </div>
  )
}
