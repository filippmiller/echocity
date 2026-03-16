'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'

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

export default function SubscriptionPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [status, setStatus] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/subscriptions/plans').then((r) => r.json()),
      user ? fetch('/api/subscriptions/status').then((r) => r.json()) : Promise.resolve(null),
    ]).then(([plansData, statusData]) => {
      setPlans(plansData.plans || [])
      setStatus(statusData)
      setLoading(false)
    })
  }, [user])

  const handleSubscribe = async (planCode: string) => {
    setActionLoading(true)
    const res = await fetch('/api/subscriptions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planCode }),
    })
    if (res.ok) {
      const statusRes = await fetch('/api/subscriptions/status')
      setStatus(await statusRes.json())
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

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-gray-500 text-center">Загрузка...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Подписка</h1>
      {status?.isSubscribed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            Текущий план: <span className="font-bold">{status.planCode}</span> ({status.status})
          </p>
          {status.endAt && <p className="text-sm text-green-600 mt-1">Действует до: {new Date(status.endAt).toLocaleDateString('ru')}</p>}
          <button onClick={handleCancel} disabled={actionLoading} className="mt-2 text-sm text-red-600 hover:underline">
            Отменить подписку
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = status?.planCode === plan.code
          const isFree = plan.code === 'free'
          return (
            <div key={plan.id} className={`border rounded-xl p-5 ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
              <p className="text-2xl font-bold mt-2">
                {isFree ? 'Бесплатно' : `${plan.monthlyPrice / 100}\u20BD/мес`}
              </p>
              {plan.trialDays > 0 && <p className="text-sm text-green-600 mt-1">{plan.trialDays} дней бесплатно</p>}
              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                <li>Предложений: {(plan.features as any).maxOffers === -1 ? 'безлимитно' : (plan.features as any).maxOffers}</li>
                {(plan.features as any).flash && <li>Flash-акции</li>}
                {(plan.features as any).priorityDemand && <li>Приоритетные запросы</li>}
              </ul>
              {!isFree && !isCurrent && user && (
                <button
                  onClick={() => handleSubscribe(plan.code)}
                  disabled={actionLoading}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  Подписаться
                </button>
              )}
              {isCurrent && <p className="mt-4 text-center text-sm text-blue-600 font-medium">Текущий план</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
