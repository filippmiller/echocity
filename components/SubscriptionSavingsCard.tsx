'use client'

import { useEffect, useState, useRef } from 'react'
import { TrendingUp, Sparkles } from 'lucide-react'

interface SavingsData {
  monthlySaved: number
  totalSaved: number
  monthName: string
}

// Subscription Plus price in rubles (matches DB: 29900 kopecks = 299 RUB)
const PLUS_PRICE_RUB = 299

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    startTime.current = null

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}

function formatRubles(amount: number): string {
  return amount.toLocaleString('ru-RU')
}

export function SubscriptionSavingsCard() {
  const [data, setData] = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)

  const animatedMonthly = useAnimatedCounter(data?.monthlySaved ?? 0)
  const animatedTotal = useAnimatedCounter(data?.totalSaved ?? 0, 1500)

  useEffect(() => {
    fetch('/api/savings/monthly')
      .then((r) => {
        if (r.ok) return r.json()
        return null
      })
      .then((d) => {
        if (d) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Don't render while loading or if no data
  if (loading || !data) return null

  // Don't show if user has no savings at all
  if (data.monthlySaved === 0 && data.totalSaved === 0) return null

  const paybackMultiplier =
    data.monthlySaved > 0 && PLUS_PRICE_RUB > 0
      ? Math.floor(data.monthlySaved / PLUS_PRICE_RUB)
      : 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-5 text-white shadow-lg">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10" />

      {/* Header */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <TrendingUp className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-white">Ваша экономия с Plus</h3>
      </div>

      {/* Main stat — monthly savings */}
      <div className="relative mb-1">
        <p className="text-xs font-medium text-green-100 uppercase tracking-wide">
          В {data.monthName}
        </p>
        <p className="text-4xl font-bold tracking-tight">
          {formatRubles(animatedMonthly)} ₽
        </p>
      </div>

      {/* Payback line */}
      {paybackMultiplier >= 1 && (
        <div className="relative flex items-center gap-1.5 mb-4">
          <Sparkles className="h-4 w-4 text-yellow-300 shrink-0" />
          <p className="text-sm font-medium text-green-100">
            Подписка Plus окупилась в{' '}
            <span className="text-white font-bold">{paybackMultiplier}×</span>!
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="relative my-3 border-t border-white/20" />

      {/* All-time savings */}
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs text-green-100">Всего сэкономлено</p>
          <p className="text-xl font-bold">{formatRubles(animatedTotal)} ₽</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-green-100">Подписка</p>
          <p className="text-sm font-semibold text-green-200">Plus</p>
        </div>
      </div>
    </div>
  )
}
