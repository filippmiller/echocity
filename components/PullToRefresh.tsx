'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  /** Pull distance in px before refresh triggers (default 60) */
  threshold?: number
}

const THRESHOLD = 60

/**
 * PullToRefresh — wraps children in a pull-down-to-refresh gesture.
 * Only active on touch devices.
 */
export function PullToRefresh({ onRefresh, children, threshold = THRESHOLD }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0)   // current pull distance (capped at threshold * 1.5)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only initiate if already scrolled to the top
    const el = containerRef.current
    if (!el) return
    if (window.scrollY > 0) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startYRef.current === null) return
    if (refreshing) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 0) {
      startYRef.current = null
      setPullY(0)
      return
    }
    // Dampen the pull — rubber-band effect
    const damped = Math.min(delta * 0.45, threshold * 1.5)
    setPullY(damped)
    // Prevent default scroll-bounce only when we're handling the gesture
    if (delta > 10) {
      e.preventDefault()
    }
  }, [refreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return
    startYRef.current = null

    if (pullY >= threshold && !refreshing) {
      setRefreshing(true)
      setPullY(threshold) // Hold at threshold while refreshing
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullY(0)
      }
    } else {
      setPullY(0)
    }
  }, [pullY, threshold, refreshing, onRefresh])

  useEffect(() => {
    if (!isTouchDevice) return
    const el = containerRef.current
    if (!el) return

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isTouchDevice, handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullY / threshold, 1)
  const isReady = pullY >= threshold

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullY > 4 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
            style={{ marginTop: refreshing ? 0 : pullY * 0.5 - 48 }}
          >
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-colors ${
                isReady || refreshing
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {/* Branded animated icon */}
              <motion.div
                animate={refreshing ? { rotate: 360 } : { rotate: progress * 180 }}
                transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
                className="w-5 h-5 flex items-center justify-center"
              >
                {/* ГС monogram as spinner */}
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeDasharray={`${progress * 40} 50`}
                    className={refreshing ? '' : ''}
                  />
                  <text x="10" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">
                    ГС
                  </text>
                </svg>
              </motion.div>
              {refreshing ? 'Обновляем...' : isReady ? 'Отпустите' : 'Потяните вниз'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content shifted down while pulling */}
      <motion.div
        animate={{ y: refreshing ? 48 : pullY > 4 ? pullY * 0.35 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
