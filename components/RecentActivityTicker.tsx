'use client'

import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

interface RecentActivityTickerProps {
  offerId: string
}

interface ActivityData {
  recentCount: number
  lastRedeemedMinutesAgo: number | null
}

export function RecentActivityTicker({ offerId }: RecentActivityTickerProps) {
  const [activity, setActivity] = useState<ActivityData | null>(null)

  useEffect(() => {
    fetch(`/api/offers/${offerId}/activity`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setActivity(data))
      .catch(() => {})
  }, [offerId])

  if (!activity || activity.recentCount === 0) return null

  const getTimeAgoText = (minutes: number | null): string | null => {
    if (minutes === null) return null
    if (minutes < 1) return 'только что'
    if (minutes < 60) return `${minutes} мин назад`
    const hours = Math.floor(minutes / 60)
    return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`
  }

  const timeAgo = getTimeAgoText(activity.lastRedeemedMinutesAgo)

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
      <Zap className="w-3.5 h-3.5 text-green-600 shrink-0" />
      <p className="text-xs text-green-700 font-medium">
        <span className="font-bold">{activity.recentCount}</span>
        {' '}{activity.recentCount === 1 ? 'человек использовал' : activity.recentCount < 5 ? 'человека использовали' : 'человек использовали'}{' '}
        за последние 24 часа
        {timeAgo && <span className="text-green-500"> · последний {timeAgo}</span>}
      </p>
    </div>
  )
}
