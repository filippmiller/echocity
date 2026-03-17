'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

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

interface StoryViewerProps {
  groups: StoryGroup[]
  startGroupIndex: number
  onClose: () => void
}

const AUTO_ADVANCE_MS = 5000

export function StoryViewer({ groups, startGroupIndex, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(Date.now())

  const currentGroup = groups[groupIndex]
  const currentStory = currentGroup?.stories[storyIndex]

  // Record view
  useEffect(() => {
    if (!currentStory) return
    fetch(`/api/stories/${currentStory.id}/view`, { method: 'POST' }).catch(() => {})
  }, [currentStory?.id])

  // Auto-advance timer
  useEffect(() => {
    startTimeRef.current = Date.now()
    setProgress(0)

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min((elapsed / AUTO_ADVANCE_MS) * 100, 100)
      setProgress(pct)

      if (pct >= 100) {
        goNext()
      }
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [groupIndex, storyIndex])

  const goNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    if (currentGroup && storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1)
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1)
      setStoryIndex(0)
    } else {
      onClose()
    }
  }, [groupIndex, storyIndex, currentGroup, groups.length, onClose])

  const goPrev = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1)
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1)
      const prevGroup = groups[groupIndex - 1]
      setStoryIndex(prevGroup ? prevGroup.stories.length - 1 : 0)
    }
  }, [groupIndex, storyIndex, groups])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === ' ') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

  if (!currentGroup || !currentStory) return null

  const totalStories = currentGroup.stories.length

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        aria-label="Закрыть"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bars */}
      <div className="absolute top-3 left-3 right-14 z-20 flex gap-1">
        {currentGroup.stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{
                width:
                  i < storyIndex
                    ? '100%'
                    : i === storyIndex
                      ? `${progress}%`
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Merchant header */}
      <div className="absolute top-8 left-3 right-14 z-20 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-white">
            {currentGroup.merchantName.charAt(0)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{currentGroup.merchantName}</p>
          <p className="text-xs text-white/60 truncate">{currentGroup.branchTitle}</p>
        </div>
      </div>

      {/* Touch areas */}
      <div className="absolute inset-0 z-10 flex">
        <button
          onClick={goPrev}
          className="w-1/3 h-full focus:outline-none"
          aria-label="Назад"
        />
        <div className="w-1/3 h-full" />
        <button
          onClick={goNext}
          className="w-1/3 h-full focus:outline-none"
          aria-label="Далее"
        />
      </div>

      {/* Story media */}
      <div className="relative w-full h-full max-w-lg mx-auto">
        <img
          src={currentStory.mediaUrl}
          alt={currentStory.caption || 'Story'}
          className="w-full h-full object-contain"
        />

        {/* Caption overlay */}
        {currentStory.caption && (
          <div className="absolute bottom-24 left-0 right-0 z-20 px-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-white text-sm leading-snug">{currentStory.caption}</p>
            </div>
          </div>
        )}

        {/* Linked offer button */}
        {currentStory.linkOfferId && (
          <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center px-4">
            <Link
              href={`/offers/${currentStory.linkOfferId}`}
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="bg-white text-gray-900 px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {currentStory.offerTitle || 'Смотреть предложение'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
