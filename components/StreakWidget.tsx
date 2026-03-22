'use client'

import { useState, useEffect } from 'react'
import { Flame, Snowflake, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import Link from 'next/link'

interface StreakData {
  current: number
  longest: number
  freezeTokens: number
  isAtRisk: boolean
  isBroken: boolean
  engagedToday: boolean
}

export function StreakWidget() {
  const { user } = useAuth()
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [freezing, setFreezing] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch('/api/streaks')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStreak(data))
      .catch(() => {})
  }, [user])

  const handleFreeze = async () => {
    setFreezing(true)
    try {
      const res = await fetch('/api/streaks/freeze', { method: 'POST' })
      if (res.ok) {
        toast.success('Стрик заморожен!')
        setStreak((prev) => prev ? { ...prev, isAtRisk: false, isBroken: false } : prev)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setFreezing(false)
    }
  }

  if (!user || !streak || streak.current === 0) return null

  return (
    <div className={`rounded-xl px-3 py-2 flex items-center gap-2 text-sm ${
      streak.isBroken
        ? 'bg-red-50 border border-red-200'
        : streak.isAtRisk
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-orange-50 border border-orange-100'
    }`}>
      <Flame className={`w-4 h-4 shrink-0 ${
        streak.isBroken ? 'text-red-400' : streak.isAtRisk ? 'text-amber-500' : 'text-orange-500'
      }`} />

      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="font-bold text-gray-900">{streak.current}</span>
        <span className="text-gray-500 text-xs truncate">
          {streak.current === 1 ? 'день' : streak.current < 5 ? 'дня' : 'дней'}
        </span>

        {streak.isAtRisk && !streak.isBroken && (
          <span className="flex items-center gap-0.5 text-amber-600 text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            под угрозой
          </span>
        )}

        {streak.isBroken && streak.freezeTokens > 0 && (
          <button
            onClick={handleFreeze}
            disabled={freezing}
            className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Snowflake className="w-3 h-3" />
            {freezing ? '...' : 'Заморозить'}
          </button>
        )}
      </div>

      {streak.freezeTokens > 0 && (
        <span className="flex items-center gap-0.5 text-blue-500 text-xs shrink-0" title="Заморозки">
          <Snowflake className="w-3 h-3" />
          {streak.freezeTokens}
        </span>
      )}

      <Link href="/missions" className="text-xs text-gray-400 hover:text-gray-600 shrink-0">→</Link>
    </div>
  )
}
