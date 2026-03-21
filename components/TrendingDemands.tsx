'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Users, ArrowRight, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { AuthPrompt } from '@/components/AuthPrompt'
import { toast } from 'sonner'
import { hapticTap } from '@/lib/haptics'

interface TrendingDemand {
  id: string
  placeName: string
  placeId: string | null
  placeAddress: string | null
  categoryName: string | null
  cityName: string
  supportCount: number
  responseCount: number
  status: string
  createdAt: string
}

export function TrendingDemands({ city }: { city?: string }) {
  const { user } = useAuth()
  const [demands, setDemands] = useState<TrendingDemand[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [supportingId, setSupportingId] = useState<string | null>(null)
  const [responseRate, setResponseRate] = useState<number>(0)

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    params.set('limit', '5')

    fetch(`/api/demand/trending?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDemands(data.demands || [])
        setResponseRate(data.responseRate ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city])

  const handleSupport = async (demandId: string) => {
    if (!user) {
      setShowAuth(true)
      return
    }
    setSupportingId(demandId)
    try {
      const res = await fetch('/api/demand/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandRequestId: demandId }),
      })
      const data = await res.json()
      if (data.alreadySupported) {
        toast.info('Вы уже поддержали этот запрос')
      } else {
        toast.success('Голос учтён!')
        setDemands((prev) =>
          prev.map((d) =>
            d.id === demandId ? { ...d, supportCount: d.supportCount + 1 } : d
          )
        )
      }
      hapticTap()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSupportingId(null)
    }
  }

  if (loading || demands.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-bold text-gray-900">Люди хотят скидки</h2>
        </div>
        {responseRate > 0 && (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
            {responseRate}% получают ответ
          </span>
        )}
      </div>

      <div className="space-y-2">
        {demands.map((demand) => (
          <div
            key={demand.id}
            className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {demand.placeName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {demand.categoryName && (
                  <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                    {demand.categoryName}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  {demand.supportCount} {demand.supportCount === 1 ? 'хочет' : 'хотят'}
                </span>
                {demand.responseCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-green-600">
                    <MessageCircle className="w-3 h-3" />
                    {demand.responseCount} {demand.responseCount === 1 ? 'ответ' : 'ответа'}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSupport(demand.id)}
              disabled={supportingId === demand.id}
              className="shrink-0 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              +1
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <AuthPrompt
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        reason="Войдите, чтобы поддержать запрос на скидку"
        redirectTo="/offers"
      />
    </div>
  )
}
