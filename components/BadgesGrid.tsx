'use client'

import { useEffect, useState } from 'react'

interface BadgeData {
  id: string
  code: string
  title: string
  description: string
  iconEmoji: string
  category: string
  earned: boolean
  earnedAt: string | null
}

interface BadgesResponse {
  badges: BadgeData[]
  earnedCount: number
  totalCount: number
}

function BadgeItem({ badge }: { badge: BadgeData }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all w-full ${
          badge.earned
            ? 'bg-white shadow-sm hover:shadow-md border border-gray-100'
            : 'bg-gray-50 opacity-50 grayscale'
        }`}
      >
        <span className="text-3xl">{badge.iconEmoji}</span>
        <span
          className={`text-[11px] font-medium text-center leading-tight ${
            badge.earned ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          {badge.earned ? badge.title : '???'}
        </span>
      </button>

      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
          <p className="font-medium">{badge.title}</p>
          <p className="text-gray-300 mt-0.5">{badge.description}</p>
          {badge.earned && badge.earnedAt && (
            <p className="text-gray-400 mt-0.5">
              {new Date(badge.earnedAt).toLocaleDateString('ru-RU')}
            </p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        </div>
      )}
    </div>
  )
}

export function BadgesGrid() {
  const [data, setData] = useState<BadgesResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gamification/badges')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-28 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.badges.length === 0) return null

  // Sort: earned first, then by sortOrder
  const sorted = [...data.badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1
    if (!a.earned && b.earned) return 1
    return 0
  })

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">🏅</span>
        Значки
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {data.earnedCount} / {data.totalCount}
        </span>
      </h3>

      <div className="grid grid-cols-4 gap-2">
        {sorted.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  )
}
