'use client'

import { useEffect, useState } from 'react'

interface MissionData {
  id: string
  code: string
  title: string
  description: string
  iconEmoji: string
  targetValue: number
  xpReward: number
  currentValue: number
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  completedAt: string | null
}

interface MissionsResponse {
  missions: MissionData[]
  active: MissionData[]
  completed: MissionData[]
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const percent = Math.min((current / target) * 100, 100)

  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-brand-500 to-brand-600"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function formatProgress(current: number, target: number, code: string): string {
  // For savings missions, show in rubles
  if (code === 'BIG_SAVER') {
    const currentRub = Math.floor(current / 100)
    const targetRub = Math.floor(target / 100)
    return `${currentRub.toLocaleString('ru-RU')} / ${targetRub.toLocaleString('ru-RU')} ₽`
  }
  return `${current} / ${target}`
}

export function MissionsCard({ limit }: { limit?: number }) {
  const [data, setData] = useState<MissionsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gamification/missions')
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
        <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data || data.missions.length === 0) return null

  // Show active first, then completed; optionally limit
  const sorted = [...data.active, ...data.completed]
  const displayed = limit ? sorted.slice(0, limit) : sorted

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-lg">🎯</span>
        Миссии
        {data.completed.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            {data.completed.length} выполнено
          </span>
        )}
      </h3>

      <div className="space-y-3">
        {displayed.map((mission) => {
          const isCompleted = mission.status === 'COMPLETED'

          return (
            <div
              key={mission.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isCompleted ? 'bg-emerald-50/50' : 'bg-gray-50'
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">
                {isCompleted ? '✅' : mission.iconEmoji}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-medium truncate ${
                      isCompleted ? 'text-emerald-800' : 'text-gray-900'
                    }`}
                  >
                    {mission.title}
                  </p>
                  <span
                    className={`text-xs font-semibold shrink-0 px-1.5 py-0.5 rounded ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    +{mission.xpReward} XP
                  </span>
                </div>

                {!isCompleted && (
                  <div className="mt-1.5">
                    <ProgressBar
                      current={mission.currentValue}
                      target={mission.targetValue}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      {formatProgress(mission.currentValue, mission.targetValue, mission.code)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {limit && sorted.length > limit && (
        <a
          href="/missions"
          className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700 mt-4 py-2"
        >
          Все миссии ({sorted.length})
        </a>
      )}
    </div>
  )
}
