'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Clock, MapPin, ArrowLeft, Tag, Loader2, ShoppingBag, TrendingUp, Wallet } from 'lucide-react'

interface RedemptionItem {
  id: string
  status: 'SUCCESS' | 'REVERSED' | 'REJECTED' | 'FRAUD_SUSPECTED'
  orderAmount: string | null
  discountAmount: string | null
  currency: string
  redeemedAt: string
  offer: {
    id: string
    title: string
    subtitle: string | null
    benefitType: 'PERCENT' | 'FIXED_AMOUNT' | 'FIXED_PRICE' | 'FREE_ITEM' | 'BUNDLE'
    benefitValue: string
    offerType: string
    imageUrl: string | null
  }
  branch: {
    id: string
    title: string
    address: string
    city: string
  }
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SUCCESS: {
    label: 'Использовано',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  REVERSED: {
    label: 'Отменено',
    className: 'bg-gray-50 text-gray-600 border border-gray-200',
  },
  REJECTED: {
    label: 'Отклонено',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  FRAUD_SUSPECTED: {
    label: 'Подозрительно',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
}

function formatBenefit(type: string, value: string): string {
  const num = parseFloat(value)
  switch (type) {
    case 'PERCENT':
      return `-${num}%`
    case 'FIXED_AMOUNT':
      return `-${num} ₽`
    case 'FIXED_PRICE':
      return `${num} ₽`
    case 'FREE_ITEM':
      return 'Бесплатно'
    case 'BUNDLE':
      return 'Комбо'
    default:
      return `${num}`
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const observerRef = useRef<HTMLDivElement>(null)

  const fetchHistory = useCallback(async (offset: number) => {
    const res = await fetch(`/api/user/history?limit=20&offset=${offset}`)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  }, [])

  // Initial load
  useEffect(() => {
    fetchHistory(0)
      .then((data) => {
        setRedemptions(data.redemptions)
        setHasMore(data.hasMore)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fetchHistory])

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true)
          fetchHistory(redemptions.length)
            .then((data) => {
              setRedemptions((prev) => [...prev, ...data.redemptions])
              setHasMore(data.hasMore)
            })
            .catch(() => {})
            .finally(() => setLoadingMore(false))
        }
      },
      { threshold: 0.1 }
    )

    const el = observerRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [hasMore, loadingMore, redemptions.length, fetchHistory])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">История скидок</h1>
            {!loading && total > 0 && (
              <p className="text-xs text-gray-500">
                {total} {total === 1 ? 'использование' : total < 5 ? 'использования' : 'использований'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Savings summary banner */}
        {!loading && redemptions.length > 0 && (() => {
          const successful = redemptions.filter((r) => r.status === 'SUCCESS')
          const totalSaved = successful.reduce((sum, r) => {
            const amt = r.discountAmount ? parseFloat(r.discountAmount) : 0
            return sum + amt
          }, 0)
          const uniquePlaces = new Set(successful.map((r) => r.branch.id)).size
          return (
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-4 mb-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-semibold">Ваша экономия</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-2xl font-bold">{Math.round(totalSaved)} ₽</p>
                  <p className="text-xs text-green-100">сэкономлено</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{successful.length}</p>
                  <p className="text-xs text-green-100">скидок</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniquePlaces}</p>
                  <p className="text-xs text-green-100">мест</p>
                </div>
              </div>
              {totalSaved > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-green-100">
                  <TrendingUp className="w-3.5 h-3.5" />
                  В среднем {Math.round(totalSaved / Math.max(successful.length, 1))} ₽ за визит
                </div>
              )}
            </div>
          )
        })()}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && redemptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Вы ещё не использовали скидки
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Находите выгодные предложения рядом с вами и экономьте каждый день
            </p>
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm hover:bg-brand-700 transition-colors"
            >
              <Tag className="w-4 h-4" />
              Смотреть скидки
            </Link>
          </div>
        )}

        {/* Redemption list */}
        {!loading && redemptions.length > 0 && (
          <div className="space-y-3">
            {redemptions.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.SUCCESS
              const benefitText = formatBenefit(item.offer.benefitType, item.offer.benefitValue)
              const savedAmount = item.discountAmount ? parseFloat(item.discountAmount) : null

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3">
                    {/* Benefit badge */}
                    <div className="w-14 h-14 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-brand-700 text-center leading-tight">
                        {benefitText}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 text-sm leading-tight truncate">
                          {item.offer.title}
                        </h3>
                        <span
                          className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {item.branch.title}, {item.branch.address}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDate(item.redeemedAt)}, {formatTime(item.redeemedAt)}
                          </span>
                        </div>
                        {savedAmount !== null && savedAmount > 0 && item.status === 'SUCCESS' && (
                          <span className="text-xs font-medium text-emerald-600">
                            -{savedAmount} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-8" />

            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
