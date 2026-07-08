'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MapPin, ChevronDown, Check } from 'lucide-react'

const CITY_KEY = 'echocity_city'
const DISTRICT_KEY = 'echocity_district'
const DEFAULT_CITY = 'Санкт-Петербург'

interface CityOption {
  name: string
  shortName: string
}

interface DistrictOption {
  id: string
  name: string
  slug: string
}

const DEFAULT_CITIES: CityOption[] = [
  { name: 'Санкт-Петербург', shortName: 'СПб' },
  { name: 'Москва', shortName: 'Мск' },
]

function slugifyCityName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function useCity() {
  const router = useRouter()
  const pathname = usePathname()
  const [city, setCity] = useState(DEFAULT_CITY)
  const [cities, setCities] = useState<CityOption[]>(DEFAULT_CITIES)
  const [district, setDistrict] = useState<DistrictOption | null>(null)
  const [districts, setDistricts] = useState<DistrictOption[]>([])

  // Load available cities once
  useEffect(() => {
    fetch('/api/public/cities')
      .then((res) => res.json())
      .then((data) => {
        const cityNames = Array.isArray(data.cities)
          ? data.cities.map((item: { name: string; shortName?: string }) => ({
              name: item.name,
              shortName: item.shortName || item.name,
            })).filter((c: CityOption) => c.name)
          : []
        if (cityNames.length > 0) {
          setCities(cityNames)
        }
      })
      .catch(() => {})
  }, [])

  // Initialize from URL or localStorage
  useEffect(() => {
    let initialCity = DEFAULT_CITY
    let initialDistrictSlug: string | null = null
    try {
      const urlCity = new URLSearchParams(window.location.search).get('city')
      if (urlCity) {
        initialCity = urlCity
      } else {
        const stored = localStorage.getItem(CITY_KEY)
        if (stored) initialCity = stored
      }
      initialDistrictSlug = new URLSearchParams(window.location.search).get('district') || localStorage.getItem(DISTRICT_KEY)
    } catch {}
    setCity(initialCity)
    if (initialDistrictSlug) {
      setDistrict({ id: '', slug: initialDistrictSlug, name: initialDistrictSlug })
    }
  }, [])

  // Fetch districts when city changes
  useEffect(() => {
    const citySlug = slugifyCityName(city)
    fetch(`/api/districts?citySlug=${encodeURIComponent(citySlug)}`)
      .then((res) => res.json())
      .then((data) => {
        const loaded = Array.isArray(data.districts) ? data.districts : []
        setDistricts(loaded)
        // Validate current district exists in new city
        if (district && !loaded.some((d: DistrictOption) => d.slug === district.slug)) {
          setDistrict(null)
          try { localStorage.removeItem(DISTRICT_KEY) } catch {}
        }
      })
      .catch(() => setDistricts([]))
  }, [city])

  const changeCity = useCallback((newCity: string) => {
    setCity(newCity)
    setDistrict(null)
    try {
      localStorage.setItem(CITY_KEY, newCity)
      localStorage.removeItem(DISTRICT_KEY)
    } catch {}

    // Sync with URL if it already has a city param; otherwise leave URL clean
    const current = new URLSearchParams(window.location.search)
    if (current.has('city')) {
      current.set('city', newCity)
      current.delete('district')
      router.replace(`${pathname}?${current.toString()}`, { scroll: false })
    }
  }, [pathname, router])

  const changeDistrict = useCallback((newDistrict: DistrictOption | null) => {
    setDistrict(newDistrict)
    try {
      if (newDistrict) {
        localStorage.setItem(DISTRICT_KEY, newDistrict.slug)
      } else {
        localStorage.removeItem(DISTRICT_KEY)
      }
    } catch {}

    // Sync with URL if it already has a city/district param
    const current = new URLSearchParams(window.location.search)
    if (current.has('city') || current.has('district')) {
      if (newDistrict) {
        current.set('district', newDistrict.slug)
      } else {
        current.delete('district')
      }
      router.replace(`${pathname}?${current.toString()}`, { scroll: false })
    }
  }, [pathname, router])

  return { city, changeCity, cities, district, changeDistrict, districts }
}

export function CitySelector() {
  const { city, changeCity, cities, district, changeDistrict, districts } = useCity()
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

  const shortName = cities.find((c) => c.name === city)?.shortName || city

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs ec-muted hover:text-[color:var(--ec-text)] transition-colors rounded-lg px-2 py-1.5 hover:bg-[color:var(--ec-surface)] text-btn"
      >
        <MapPin className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{city}</span>
        <span className="sm:hidden">{shortName}</span>
        {district && (
          <span className="hidden sm:inline ec-muted">· {district.name}</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="ec-surface absolute top-full left-0 mt-1 w-56 rounded-2xl py-1 z-20 max-h-[70vh] overflow-y-auto">
            <div className="px-3 py-2 border-b ec-line">
              <p className="text-[11px] font-semibold ec-muted uppercase tracking-[0.14em]">Город</p>
            </div>
            {cities.map((c) => (
              <button
                key={c.name}
                onClick={() => { changeCity(c.name); setOpen(false) }}
                className={`flex items-center justify-between w-full text-left px-3 py-2.5 text-sm transition-colors text-btn ${
                  city === c.name
                    ? 'ec-accent-text bg-[color:var(--ec-surface-muted)] font-medium'
                    : 'text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {c.name}
                </span>
                {city === c.name && <Check className="w-4 h-4" />}
              </button>
            ))}

            {districts.length > 0 && (
              <>
                <div className="px-3 py-2 border-t border-b ec-line mt-1">
                  <p className="text-[11px] font-semibold ec-muted uppercase tracking-[0.14em]">Район</p>
                </div>
                <button
                  onClick={() => { changeDistrict(null); setOpen(false) }}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm transition-colors text-btn ${
                    !district
                      ? 'ec-accent-text bg-[color:var(--ec-surface-muted)] font-medium'
                      : 'text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]'
                  }`}
                >
                  <span>Все районы</span>
                  {!district && <Check className="w-4 h-4" />}
                </button>
                {districts.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => { changeDistrict(d); setOpen(false) }}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm transition-colors text-btn ${
                      district?.slug === d.slug
                        ? 'ec-accent-text bg-[color:var(--ec-surface-muted)] font-medium'
                        : 'text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]'
                    }`}
                  >
                    <span className="truncate">{d.name}</span>
                    {district?.slug === d.slug && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
