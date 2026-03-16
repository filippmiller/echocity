'use client'

import { useState } from 'react'
import { OfferFeed } from '@/components/OfferFeed'

const CITIES = ['Санкт-Петербург', 'Москва']
const SECTIONS = [
  { key: 'all', label: 'Все' },
  { key: 'FREE_FOR_ALL', label: 'Бесплатные' },
  { key: 'MEMBERS_ONLY', label: 'Для подписчиков' },
]

export default function OffersPage() {
  const [city, setCity] = useState('Санкт-Петербург')
  const [section, setSection] = useState('all')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Скидки и предложения</h1>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5 text-gray-700"
        >
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
              section === s.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <OfferFeed city={city} visibility={section === 'all' ? undefined : section} />
    </div>
  )
}
