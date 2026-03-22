'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'
import { Dices, Clock, ChevronLeft, Sparkles, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { hapticTap } from '@/lib/haptics'

interface RouletteResult {
  offer: {
    id: string
    title: string
    subtitle: string | null
    benefitType: string
    benefitValue: number
    imageUrl: string | null
    branchName: string
    branchAddress: string
    nearestMetro: string | null
    isVerified: boolean
    visibility: string
    offerType: string
  }
  expiresAt: string
  spunAt: string
}

function getBenefitBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    default: return `${benefitValue}`
  }
}

function canSpinToday(): boolean {
  try {
    const lastSpin = localStorage.getItem('echocity_roulette_last')
    if (!lastSpin) return true
    const lastDate = new Date(lastSpin).toDateString()
    const today = new Date().toDateString()
    return lastDate !== today
  } catch {
    return true
  }
}

function markSpinUsed() {
  try {
    localStorage.setItem('echocity_roulette_last', new Date().toISOString())
  } catch {
    // localStorage unavailable
  }
}

export default function RoulettePage() {
  const { user, loading: authLoading } = useAuth()
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<RouletteResult | null>(null)
  const [rotation, setRotation] = useState(0)
  const [hasSpun, setHasSpun] = useState(!canSpinToday())

  const handleSpin = useCallback(async () => {
    if (!user) {
      toast.error('Войдите, чтобы крутить рулетку')
      return
    }
    if (hasSpun) {
      toast.info('Вы уже крутили сегодня! Приходите завтра')
      return
    }

    setSpinning(true)
    setResult(null)
    hapticTap()

    // Start spin animation
    const newRotation = rotation + 1440 + Math.floor(Math.random() * 360)
    setRotation(newRotation)

    try {
      const res = await fetch('/api/roulette/spin')
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Ошибка рулетки')
        setSpinning(false)
        return
      }

      const data: RouletteResult = await res.json()

      // Wait for animation to finish
      setTimeout(() => {
        setResult(data)
        setSpinning(false)
        setHasSpun(true)
        markSpinUsed()
        hapticTap()
      }, 3000)
    } catch {
      toast.error('Ошибка сети')
      setSpinning(false)
    }
  }, [user, hasSpun, rotation])

  const timeLeft = result?.expiresAt
    ? (() => {
        const diff = new Date(result.expiresAt).getTime() - Date.now()
        if (diff <= 0) return null
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        return `${h}ч ${m}м`
      })()
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/offers" className="flex items-center gap-1 text-purple-200 text-sm mb-3">
            <ChevronLeft className="w-4 h-4" />
            К скидкам
          </Link>
          <div className="flex items-center gap-3">
            <Dices className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Рулетка скидок</h1>
              <p className="text-purple-200 text-sm">Крутите каждый день — получайте случайную скидку!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Roulette wheel */}
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 mb-8">
            {/* Wheel */}
            <div
              className="w-full h-full rounded-full border-8 border-purple-200 bg-gradient-conic from-purple-400 via-pink-400 via-amber-400 via-green-400 via-blue-400 to-purple-400 shadow-xl transition-transform ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? '3s' : '0s',
                background: 'conic-gradient(from 0deg, #a78bfa, #f472b6, #fbbf24, #34d399, #60a5fa, #a78bfa)',
              }}
            >
              {/* Segments */}
              {['🎁', '☕', '🍔', '💅', '🍺', '✨'].map((emoji, i) => (
                <div
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 60}deg) translateY(-90px) rotate(-${i * 60}deg)`,
                    marginTop: '-16px',
                    marginLeft: '-16px',
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>

            {/* Center button */}
            <button
              onClick={handleSpin}
              disabled={spinning || hasSpun || authLoading}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {spinning ? (
                <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
              ) : (
                <span className="text-sm font-bold text-purple-600">
                  {hasSpun ? 'Завтра' : 'КРУТИТЬ'}
                </span>
              )}
            </button>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-purple-600" />
          </div>

          {/* Status text */}
          {!user && !authLoading && (
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-3">Войдите, чтобы крутить рулетку</p>
              <Link href="/auth/login?redirect=/roulette" className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors">
                Войти
              </Link>
            </div>
          )}

          {hasSpun && !result && (
            <p className="text-gray-500 text-sm text-center">Вы уже крутили сегодня. Приходите завтра!</p>
          )}
        </div>

        {/* Result card */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Ваш выигрыш!</span>
              {timeLeft && (
                <span className="ml-auto flex items-center gap-1 text-purple-200 text-xs">
                  <Clock className="w-3 h-3" />
                  Действует {timeLeft}
                </span>
              )}
            </div>

            <div className="p-4">
              {result.offer.imageUrl && (
                <img
                  src={result.offer.imageUrl}
                  alt={result.offer.title}
                  className="w-full h-40 object-cover rounded-xl mb-4"
                />
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-lg font-bold">
                  {getBenefitBadge(result.offer.benefitType, result.offer.benefitValue)}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{result.offer.title}</h3>
              {result.offer.subtitle && (
                <p className="text-sm text-gray-500 mb-2">{result.offer.subtitle}</p>
              )}
              <p className="text-sm text-gray-600">{result.offer.branchName}</p>
              <p className="text-xs text-gray-400">{result.offer.branchAddress}</p>

              <Link
                href={`/offers/${result.offer.id}`}
                className="mt-4 block w-full text-center bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Активировать скидку
              </Link>
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="mt-8 bg-purple-50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Как это работает?</h3>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 shrink-0">1.</span>
              Крутите рулетку один раз в день бесплатно
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 shrink-0">2.</span>
              Получите случайную скидку из вашего города
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 shrink-0">3.</span>
              Активируйте в течение 4 часов
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 shrink-0">4.</span>
              Пригласите друзей — получите дополнительные вращения!
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
