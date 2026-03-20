'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakData {
  streakCurrent: number
  streakLongest: number
}

function getStreakColor(streak: number): string {
  if (streak >= 14) return 'text-red-500'
  if (streak >= 7) return 'text-amber-500'
  if (streak >= 3) return 'text-orange-400'
  return 'text-gray-400'
}

function getStreakBg(streak: number): string {
  if (streak >= 14) return 'bg-red-50 border-red-200'
  if (streak >= 7) return 'bg-amber-50 border-amber-200'
  if (streak >= 3) return 'bg-orange-50 border-orange-200'
  return 'bg-gray-50 border-gray-200'
}

export function StreakBadge() {
  const [data, setData] = useState<StreakData | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    fetch('/api/streak')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d)
      })
      .catch(() => {})
  }, [])

  if (!data || data.streakCurrent === 0) return null

  const color = getStreakColor(data.streakCurrent)
  const bg = getStreakBg(data.streakCurrent)
  const shouldPulse = data.streakCurrent >= 7

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip((v) => !v)}
        className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${bg} ${color} transition-colors`}
        aria-label={`Серия входов: ${data.streakCurrent} дней`}
      >
        {shouldPulse ? (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center"
          >
            <Flame className={`w-3.5 h-3.5 ${color}`} />
          </motion.span>
        ) : (
          <Flame className={`w-3.5 h-3.5 ${color}`} />
        )}
        <span>{data.streakCurrent}</span>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          <p>Серия: {data.streakCurrent} {getDayWord(data.streakCurrent)}</p>
          <p className="text-gray-300 mt-0.5">Рекорд: {data.streakLongest} {getDayWord(data.streakLongest)}</p>
          <div className="absolute right-3 -top-1.5 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  )
}

function getDayWord(n: number): string {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 19) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}
