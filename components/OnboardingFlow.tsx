'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, QrCode, Crown, ChevronRight } from 'lucide-react'

const ONBOARDED_KEY = 'echocity_onboarded'

const SCREENS = [
  {
    icon: MapPin,
    iconBg: 'bg-blue-500',
    title: 'Скидки рядом с вами',
    text: 'Находите выгодные предложения в кафе, ресторанах, барах и салонах красоты рядом с вами',
  },
  {
    icon: QrCode,
    iconBg: 'bg-green-500',
    title: 'Покажите QR — получите скидку',
    text: 'Активируйте предложение, покажите QR-код на кассе — скидка применяется мгновенно',
  },
  {
    icon: Crown,
    iconBg: 'bg-purple-500',
    title: 'Подписка от 199\u20BD/мес',
    text: 'Оформите подписку и экономьте каждый день. Первые 7 дней — бесплатно',
  },
]

export function OnboardingFlow() {
  const [show, setShow] = useState(false)
  const [currentScreen, setCurrentScreen] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('left')
  const [animating, setAnimating] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    // Only show on first visit
    try {
      const onboarded = localStorage.getItem(ONBOARDED_KEY)
      if (!onboarded) {
        // Small delay so the page loads first
        const timer = setTimeout(() => setShow(true), 500)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  const close = useCallback(() => {
    setShow(false)
    try {
      localStorage.setItem(ONBOARDED_KEY, '1')
    } catch {}
  }, [])

  const goNext = useCallback(() => {
    if (animating) return
    if (currentScreen === SCREENS.length - 1) {
      close()
      return
    }
    setDirection('left')
    setAnimating(true)
    setTimeout(() => {
      setCurrentScreen((s) => s + 1)
      setAnimating(false)
    }, 200)
  }, [currentScreen, close, animating])

  const goPrev = useCallback(() => {
    if (animating || currentScreen === 0) return
    setDirection('right')
    setAnimating(true)
    setTimeout(() => {
      setCurrentScreen((s) => s - 1)
      setAnimating(false)
    }, 200)
  }, [currentScreen, animating])

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
  }

  if (!show) return null

  const screen = SCREENS[currentScreen]
  const Icon = screen.icon
  const isLast = currentScreen === SCREENS.length - 1

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-none">
      {/* Semi-transparent scrim — tap to dismiss */}
      <div className="fixed inset-0 bg-black/20" onClick={close} style={{ pointerEvents: 'auto' }} />

      {/* Bottom sheet content */}
      <div
        className="relative bg-white rounded-t-3xl shadow-2xl px-6 pt-6 pb-8 pointer-events-auto animate-slide-up"
        style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Skip button — always visible */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors z-10 text-btn"
        >
          Пропустить
        </button>

        {/* Card */}
        <div
          className={`w-full max-w-sm mx-auto transition-all duration-200 ${
            animating
              ? direction === 'left'
                ? 'opacity-0 -translate-x-8'
                : 'opacity-0 translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-14 h-14 ${screen.iconBg} rounded-2xl flex items-center justify-center shadow-sm shrink-0`}>
              <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{screen.title}</h2>
              <p className="text-sm text-gray-500 leading-snug mt-0.5">{screen.text}</p>
            </div>
          </div>
        </div>

        {/* Dots + Button */}
        <div className="mt-5">
          <div className="flex justify-center gap-2 mb-4">
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentScreen
                    ? 'w-6 bg-brand-600'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-[0.98] transition-all"
          >
            {isLast ? 'Начать' : 'Далее'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
