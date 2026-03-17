'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronDown, Check } from 'lucide-react'

const CITY_KEY = 'echocity_city'
const DEFAULT_CITY = 'Санкт-Петербург'

const CITIES = [
  { name: 'Санкт-Петербург', shortName: 'СПб' },
  { name: 'Москва', shortName: 'Мск' },
]

export function useCity() {
  const [city, setCity] = useState(DEFAULT_CITY)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CITY_KEY)
      if (stored) setCity(stored)
    } catch {}
  }, [])

  const changeCity = (newCity: string) => {
    setCity(newCity)
    try {
      localStorage.setItem(CITY_KEY, newCity)
    } catch {}
  }

  return { city, changeCity }
}

export function CitySelector() {
  const { city, changeCity } = useCity()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const shortName = CITIES.find((c) => c.name === city)?.shortName || city

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors rounded-lg px-2 py-1.5 hover:bg-gray-50 text-btn"
      >
        <MapPin className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{city}</span>
        <span className="sm:hidden">{shortName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Город</p>
            </div>
            {CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => { changeCity(c.name); setOpen(false) }}
                className={`flex items-center justify-between w-full text-left px-3 py-2.5 text-sm transition-colors text-btn ${
                  city === c.name
                    ? 'text-brand-600 bg-brand-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {c.name}
                </span>
                {city === c.name && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
