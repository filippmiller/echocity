'use client'

import { useCity } from '@/components/CitySelector'

interface HomeCityBadgeProps {
  allActive: number
}

export function HomeCityBadge({ allActive }: HomeCityBadgeProps) {
  const { city } = useCity()
  return (
    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-blue-100 mb-4">
      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
      {city} &middot; {allActive} скидок
    </div>
  )
}
