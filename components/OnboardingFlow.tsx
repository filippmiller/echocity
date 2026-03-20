'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, QrCode, Crown, ChevronRight, Send, Gift, Sparkles } from 'lucide-react'
import { detectSource, type OnboardingSource } from '@/lib/onboarding-source'

const ONBOARDED_KEY = 'echocity_onboarded'
const SOURCE_KEY = 'echocity_onboarding_source'

const BASE_SCREENS = [
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

function getSourceFirstScreen(source: OnboardingSource) {
  switch (source) {
    case 'telegram':
      return {
        icon: Send,
        iconBg: 'bg-sky-500',
        title: 'Добро пожаловать из Telegram!',
        text: 'Вот скидка, которую вы смотрели — войдите, чтобы активировать её прямо сейчас',
      }
    case 'referral':
      return {
        icon: Gift,
        iconBg: 'bg-pink-500',
        title: 'Ваш друг пригласил вас!',
        text: 'Зарегистрируйтесь и получите бонус — реферальный код применится автоматически',
      }
    case 'organic':
      return {
        icon: Sparkles,
        iconBg: 'bg-amber-500',
        title: 'Нашли нас в поиске?',
        text: 'Вот что мы можем предложить — лучшие скидки города прямо в вашем телефоне',
      }
    default:
      return null
  }
}

export function OnboardingFlow() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [currentScreen, setCurrentScreen] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('left')
  const [animating, setAnimating] = useState(false)
  const [screens, setScreens] = useState(BASE_SCREENS)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    try {
      const onboarded = localStorage.getItem(ONBOARDED_KEY)
      if (onboarded) return

      const source = detectSource()

      // Store source for analytics
      try {
        localStorage.setItem(SOURCE_KEY, source)
      } catch {}

      // If arriving from Telegram with a specific offer, skip onboarding
      const params = new URLSearchParams(window.location.search)
      const offerId = params.get('offerId')
      if (source === 'telegram' && offerId) {
        localStorage.setItem(ONBOARDED_KEY, '1')
        router.push(`/offers/${offerId}`)
        return
      }

      // If arriving with a referral code, store it
      const refCode = params.get('ref') || params.get('referral')
      if (source === 'referral' && refCode) {
        try {
          localStorage.setItem('echocity_ref_code', refCode)
        } catch {}
      }

      // Build screen list — prepend source-specific first screen for non-direct sources
      const sourceScreen = getSourceFirstScreen(source)
      if (sourceScreen) {
        setScreens([sourceScreen as typeof BASE_SCREENS[0], ...BASE_SCREENS])
      } else {
        setScreens(BASE_SCREENS)
      }

      const timer = setTimeout(() => setShow(true), 500)
      return () => clearTimeout(timer)
    } catch {
      // localStorage not available
    }
  }, [router])

  const close = useCallback(() => {
    setShow(false)
    try {
      localStorage.setItem(ONBOARDED_KEY, '1')
    } catch {}
  }, [])

  const goNext = useCallback(() => {
    if (animating) return
    if (currentScreen === screens.length - 1) {
      close()
      return
    }
    setDirection('left')
    setAnimating(true)
    setTimeout(() => {
      setCurrentScreen((s) => s + 1)
      setAnimating(false)
    }, 200)
  }, [currentScreen, screens.length, close, animating])

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

  const screen = screens[currentScreen]
  const Icon = screen.icon
  const isLast = currentScreen === screens.length - 1

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
            {screens.map((_, i) => (
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
