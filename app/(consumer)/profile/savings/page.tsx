'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, PiggyBank, ArrowLeft, TrendingUp, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { SavingsTracker } from '@/components/SavingsTracker'
import { useAuth } from '@/lib/auth-client'

interface SavingsApiData {
  lifetime: { rubles: number; count: number }
  thisMonth: { rubles: number; count: number }
}

interface Redemption {
  id: string
  savedAmount: number | null
  discountAmount: number | null
  redeemedAt: string
  offer: { title: string }
  branch: { title: string; address?: string | null; city?: string | null }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRubles(kopecksOrRubles: number): string {
  return Math.floor(kopecksOrRubles).toLocaleString('ru-RU')
}

export default function SavingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [savings, setSavings] = useState<SavingsApiData | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    Promise.all([
      fetch('/api/profile/savings').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/user/history?limit=10').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([savingsData, historyData]) => {
        setSavings(savingsData)
        setRedemptions(historyData?.redemptions || [])
      })
      .catch(() => {
        toast.error('Не удалось загрузить данные об экономии')
      })
      .finally(() => setLoading(false))
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Войдите в аккаунт</h1>
          <p className="text-sm text-gray-500 mb-6">
            Моя экономия доступна только авторизованным пользователям.
          </p>
          <Link
            href="/auth/login?redirect=/profile/savings"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/profile"
              className="p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors"
              aria-label="Назад в профиль"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Моя экономия</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-emerald-50 to-brand-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-gray-500">В этом месяце</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatRubles(savings?.thisMonth.rubles ?? 0)} ₽
              </p>
            </div>

            <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="w-4 h-4 text-brand-600" />
                <span className="text-xs text-gray-500">За всё время</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatRubles(savings?.lifetime.rubles ?? 0)} ₽
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings tracker */}
      <div className="max-w-2xl mx-auto">
        <SavingsTracker />
      </div>

      {/* Recent redemptions */}
      <div className="max-w-2xl mx-auto mt-4 px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Последние скидки</h2>
            <Link
              href="/history"
              className="text-xs text-brand-600 font-medium hover:underline"
            >
              Вся история
            </Link>
          </div>

          {redemptions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Пока нет экономии</h3>
              <p className="text-xs text-gray-500 mb-4">
                Активируйте скидки в заведениях, чтобы видеть свою экономию здесь.
              </p>
              <Link
                href="/offers"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors"
              >
                Найти скидки
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {redemptions.map((r) => {
                const saved = r.savedAmount ?? r.discountAmount ?? 0
                const place = [r.branch?.title, r.branch?.address].filter(Boolean).join(', ')
                return (
                  <div
                    key={r.id}
                    className="p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.offer?.title || 'Скидка'}
                      </p>
                      {place && (
                        <p className="text-xs text-gray-500 truncate">{place}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatDate(r.redeemedAt)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                      −{formatRubles(saved)} ₽
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
