'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface ExpiryCountdownProps {
  expiresAt: string
}

function formatCountdown(ms: number): { hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function ExpiryCountdown({ expiresAt }: ExpiryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => new Date(expiresAt).getTime() - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(new Date(expiresAt).getTime() - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  // Don't show if more than 24h away or already expired
  if (timeLeft > 24 * 60 * 60 * 1000) return null
  if (timeLeft <= 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <span className="text-sm font-medium text-red-700">Предложение истекло</span>
      </div>
    )
  }

  const { hours, minutes, seconds } = formatCountdown(timeLeft)
  const isUrgent = timeLeft < 2 * 60 * 60 * 1000 // < 2 hours

  return (
    <div className={`rounded-xl p-4 mb-4 flex items-center gap-3 ${
      isUrgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
    }`}>
      <Clock className={`w-5 h-5 shrink-0 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
      <div className="flex-1">
        <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
          {isUrgent ? 'Скоро истечёт!' : 'Истекает сегодня'}
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
            {String(hours).padStart(2, '0')}
          </span>
          <span className={`text-sm ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>ч</span>
          <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
            {String(minutes).padStart(2, '0')}
          </span>
          <span className={`text-sm ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>м</span>
          <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
            {String(seconds).padStart(2, '0')}
          </span>
          <span className={`text-sm ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>с</span>
        </div>
      </div>
    </div>
  )
}
