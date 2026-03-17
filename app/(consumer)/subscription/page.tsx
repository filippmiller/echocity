'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import { Check, X, Crown, Zap, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Footer } from '@/components/Footer'

interface Plan {
  id: string
  code: string
  name: string
  monthlyPrice: number
  features: Record<string, unknown>
  trialDays: number
}

interface SubStatus {
  isSubscribed: boolean
  planCode: string | null
  status: string | null
  endAt: string | null
}

const FEATURE_MATRIX = [
  { key: 'free_deals', label: 'Бесплатные скидки', free: true, plus: true, premium: true },
  { key: 'demand', label: '«Хочу скидку»', free: true, plus: true, premium: true },
  { key: 'discovery', label: 'Поиск и карта', free: true, plus: true, premium: true },
  { key: 'member_deals', label: 'Скидки для подписчиков (10-25%)', free: false, plus: true, premium: true },
  { key: 'unlimited', label: 'Безлимитные предложения', free: false, plus: true, premium: true },
  { key: 'flash', label: 'Flash-скидки (до -30%)', free: false, plus: false, premium: true },
  { key: 'priority', label: 'Приоритетные запросы', free: false, plus: false, premium: true },
  { key: 'higher_discounts', label: 'Максимальные скидки', free: false, plus: false, premium: true },
]

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}>
      <SubscriptionContent />
    </Suspense>
  )
}

function SubscriptionContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [plans, setPlans] = useState<Plan[]>([])
  const [status, setStatus] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const refreshStatus = async () => {
    if (!user) return
    const statusRes = await fetch('/api/subscriptions/status')
    setStatus(await statusRes.json())
  }

  // Handle ?status=success from ЮKassa redirect
  useEffect(() => {
    if (searchParams.get('status') === 'success') {
      setSuccessMessage('Оплата прошла успешно! Подписка будет активирована в течение нескольких секунд.')
      // Poll for subscription activation (webhook may take a moment)
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const res = await fetch('/api/subscriptions/status')
        const data = await res.json()
        if (data?.isSubscribed) {
          setStatus(data)
          setSuccessMessage('Подписка активирована!')
          clearInterval(poll)
        }
        if (attempts >= 10) clearInterval(poll)
      }, 2000)
      return () => clearInterval(poll)
    }
  }, [searchParams])

  useEffect(() => {
    Promise.all([
      fetch('/api/subscriptions/plans').then((r) => r.json()),
      user ? fetch('/api/subscriptions/status').then((r) => r.json()) : Promise.resolve(null),
    ]).then(([plansData, statusData]) => {
      setPlans(plansData.plans || [])
      setStatus(statusData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const handleSubscribe = async (planCode: string) => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Не удалось оформить подписку')
        setActionLoading(false)
        return
      }

      // Trial — subscription created directly, just refresh status
      if (data.trial) {
        await refreshStatus()
        setSuccessMessage('Пробный период активирован!')
        setActionLoading(false)
        return
      }

      // Payment required — redirect to ЮKassa
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl
        return // keep actionLoading true while redirecting
      }

      // Fallback: refresh status
      await refreshStatus()
    } catch {
      setError('Произошла ошибка. Попробуйте позже.')
    }
    setActionLoading(false)
  }

  const handleCancel = async () => {
    setActionLoading(true)
    await fetch('/api/subscriptions/cancel', { method: 'POST' })
    const statusRes = await fetch('/api/subscriptions/status')
    setStatus(await statusRes.json())
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-deal-premium via-purple-600 to-blue-700 text-white pt-6 pb-10 px-4 text-center">
        <Crown className="w-10 h-10 mx-auto mb-3 opacity-80" />
        <h1 className="text-3xl font-bold mb-2">Выберите свой план</h1>
        <p className="text-purple-200 max-w-md mx-auto">
          Получите доступ к эксклюзивным скидкам и экономьте каждый день
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Success message */}
        {successMessage && (
          <div className="bg-deal-savings/10 border border-deal-savings/30 rounded-xl p-4 mb-4 flex items-center justify-between">
            <p className="text-deal-savings font-medium text-sm">{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="text-deal-savings/60 hover:text-deal-savings text-btn ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <p className="text-red-600 font-medium text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-btn ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Current subscription status */}
        {status?.isSubscribed && (
          <div className="bg-deal-savings/10 border border-deal-savings/20 rounded-xl p-4 mb-6">
            <p className="text-deal-savings font-medium">
              Текущий план: <span className="font-bold">{status.planCode?.toUpperCase()}</span>
              {status.status === 'TRIALING' && ' (пробный период)'}
            </p>
            {status.endAt && (
              <p className="text-sm text-deal-savings/70 mt-1">
                Действует до: {new Date(status.endAt).toLocaleDateString('ru')}
              </p>
            )}
            <button onClick={handleCancel} disabled={actionLoading} className="mt-2 text-sm text-red-500 hover:underline text-btn">
              Отменить подписку
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {plans.map((plan) => {
            const isCurrent = status?.planCode === plan.code
            const isFree = plan.code === 'free'
            const isPremium = plan.code === 'premium'
            const isPlus = plan.code === 'plus'

            return (
              <div
                key={plan.id}
                className={`relative border rounded-2xl p-5 transition-all ${
                  isPlus && !isCurrent
                    ? 'border-brand-600 bg-white ring-2 ring-brand-600/20 shadow-lg scale-[1.02]'
                    : isCurrent
                      ? 'border-deal-premium bg-deal-premium/5 ring-2 ring-deal-premium/20'
                      : isPremium
                        ? 'border-gray-200 bg-gradient-to-b from-white to-purple-50'
                        : 'border-gray-200 bg-white'
                }`}
              >
                {isPlus && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-0.5 rounded-full badge flex items-center gap-1">
                    <Star className="w-3 h-3" /> Популярный
                  </div>
                )}
                {isPremium && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-deal-premium text-white text-xs font-bold px-3 py-0.5 rounded-full badge flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Максимум
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {isFree && <span className="text-xl">🆓</span>}
                  {isPlus && <span className="text-xl">⭐</span>}
                  {isPremium && <span className="text-xl">👑</span>}
                  <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                </div>

                <p className="text-3xl font-bold text-gray-900">
                  {isFree ? '0\u20BD' : `${plan.monthlyPrice / 100}\u20BD`}
                  {!isFree && <span className="text-sm font-normal text-gray-500">/мес</span>}
                </p>
                {plan.trialDays > 0 && (
                  <p className="text-sm text-deal-savings font-medium mt-1">
                    {plan.trialDays} дней бесплатно
                  </p>
                )}

                <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
                  {FEATURE_MATRIX.map((feat) => {
                    const hasFeature = isFree ? feat.free : isPlus ? feat.plus : feat.premium
                    return (
                      <li key={feat.key} className={`flex items-center gap-2 ${!hasFeature ? 'opacity-40' : ''}`}>
                        {hasFeature ? (
                          <Check className="w-4 h-4 text-deal-savings shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                        {feat.label}
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <p className="text-center text-sm text-deal-premium font-semibold py-2.5">
                      Ваш текущий план
                    </p>
                  ) : !isFree && user ? (
                    <button
                      onClick={() => handleSubscribe(plan.code)}
                      disabled={actionLoading}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isPlus
                          ? 'bg-brand-600 text-white hover:bg-brand-700'
                          : 'bg-deal-premium text-white hover:opacity-90'
                      } disabled:opacity-50`}
                    >
                      {plan.trialDays > 0 ? 'Попробовать бесплатно' : 'Подписаться'}
                    </button>
                  ) : !isFree && !user ? (
                    <Link
                      href="/auth/login"
                      className="block w-full text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Войдите для подписки
                    </Link>
                  ) : (
                    <p className="text-center text-xs text-gray-400 py-2.5">Текущий план</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Частые вопросы</h2>
          <div className="space-y-3">
            {[
              { q: 'Что входит в пробный период?', a: 'Полный доступ ко всем функциям выбранного плана на 7 дней. Отмена в любой момент.' },
              { q: 'Как работают скидки?', a: 'Найдите предложение, нажмите «Активировать», покажите QR-код кассиру — скидка применяется на месте.' },
              { q: 'Можно ли сменить план?', a: 'Да, вы можете перейти на другой план в любое время. Разница будет пересчитана.' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 text-sm">{item.q}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
