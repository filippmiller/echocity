'use client'

import { useEffect, useState, useRef } from 'react'

interface StoryItem {
  id: string
  mediaUrl: string
  mediaType: string
  caption: string | null
  linkOfferId: string | null
  offerTitle: string | null
  viewCount: number
  viewed: boolean
  expiresAt: string
  createdAt: string
}

interface StoryGroup {
  merchantId: string
  merchantName: string
  branchId: string
  branchTitle: string
  stories: StoryItem[]
}

interface StoriesBarProps {
  city?: string
  onOpenViewer?: (groups: StoryGroup[], startGroupIndex: number) => void
}

export function StoriesBar({ city, onOpenViewer }: StoriesBarProps) {
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)

    fetch(`/api/stories?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city])

  if (loading) {
    return (
      <div className="flex gap-3 px-4 py-3 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (groups.length === 0) return null

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {groups.map((group, idx) => {
        const hasUnseen = group.stories.some((s) => !s.viewed)
        const firstStory = group.stories[0]
        const initial = group.merchantName.charAt(0).toUpperCase()

        return (
          <button
            key={group.merchantId}
            onClick={() => onOpenViewer?.(groups, idx)}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]"
          >
            <div
              className={`w-16 h-16 rounded-full p-[2px] ${
                hasUnseen
                  ? 'bg-gradient-to-tr from-brand-500 via-deal-flash to-deal-savings'
                  : 'bg-gray-300'
              }`}
            >
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                {firstStory?.mediaUrl ? (
                  <img
                    src={firstStory.mediaUrl}
                    alt={group.merchantName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-400">{initial}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-gray-600 leading-tight line-clamp-1 text-center w-full">
              {group.branchTitle}
            </span>
          </button>
        )
      })}
    </div>
  )
}
