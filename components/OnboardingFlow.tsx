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
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Content */}
      <div
        className="relative flex flex-col items-center justify-center h-full px-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Skip button */}
        {!isLast && (
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/60 text-sm font-medium hover:text-white/90 transition-colors z-10 text-btn"
            style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
          >
            Пропустить
          </button>
        )}

        {/* Card */}
        <div
          className={`w-full max-w-sm transition-all duration-200 ${
            animating
              ? direction === 'left'
                ? 'opacity-0 -translate-x-8'
                : 'opacity-0 translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Icon */}
          <div className={`w-24 h-24 ${screen.iconBg} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg`}>
            <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>

          {/* Text */}
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            {screen.title}
          </h2>
          <p className="text-base text-white/70 text-center leading-relaxed max-w-xs mx-auto">
            {screen.text}
          </p>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8" style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}>
          {/* Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentScreen
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Button */}
          <button
            onClick={goNext}
            className="w-full py-4 bg-white text-gray-900 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] transition-all"
          >
            {isLast ? 'Начать' : 'Далее'}
            {!isLast && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
