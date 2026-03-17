'use client'

import { useEffect, useState, useRef } from 'react'

interface SavingsData {
  totalSaved: number
  thisMonth: number
  thisWeek: number
  redemptionCount: number
}

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

export function SavingsCounter({ variant = 'hero' }: { variant?: 'hero' | 'profile' }) {
  const [data, setData] = useState<SavingsData | null>(null)
  const animatedMonth = useAnimatedCounter(data?.thisMonth ?? 0)

  useEffect(() => {
    fetch('/api/savings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d)
      })
      .catch(() => {})
  }, [])

  if (!data || data.thisMonth === 0) return null

  if (variant === 'hero') {
    return (
      <div className="inline-flex items-center gap-2 bg-deal-savings/10 border border-deal-savings/20 rounded-full px-4 py-1.5 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-deal-savings opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-deal-savings" />
        </span>
        <span className="text-deal-savings font-medium">
          Сэкономлено в этом месяце: {formatRubles(animatedMonth)} ₽
        </span>
      </div>
    )
  }

  // Profile variant
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-deal-savings opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-deal-savings" />
        </span>
        Ваша экономия
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-deal-savings">{formatRubles(data.totalSaved)} ₽</p>
          <p className="text-xs text-gray-500 mt-0.5">Всего</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-deal-savings">{formatRubles(data.thisMonth)} ₽</p>
          <p className="text-xs text-gray-500 mt-0.5">В этом месяце</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{data.redemptionCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Активаций</p>
        </div>
      </div>
    </div>
  )
}
