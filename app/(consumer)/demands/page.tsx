'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Search, Send, ArrowRight, Users, MessageCircle, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { AuthPrompt } from '@/components/AuthPrompt'
import { toast } from 'sonner'
import Link from 'next/link'

interface TrendingDemand {
  id: string
  placeName: string
  placeId: string | null
  placeAddress: string | null
  categoryName: string | null
  supportCount: number
  responseCount: number
  status: string
}

interface Category {
  id: string
  name: string
  icon: string | null
}

interface City {
  id: string
  name: string
}

export default function DemandsPage() {
  const { user } = useAuth()
  const [demands, setDemands] = useState<TrendingDemand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [responseRate, setResponseRate] = useState(0)

  // Form state
  const [placeName, setPlaceName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/demand/trending?limit=20').then((r) => r.json()),
      fetch('/api/services/categories').then((r) => r.json()).catch(() => ({ categories: [] })),
      fetch('/api/public/cities').then((r) => r.json()).catch(() => ({ cities: [] })),
    ]).then(([demandData, catData, cityData]) => {
      setDemands(demandData.demands || [])
      setResponseRate(demandData.responseRate ?? 0)
      setCategories(catData.categories || [])
      const cityList = Array.isArray(cityData.cities) ? cityData.cities : []
      setCities(cityList)
      if (cityList.length > 0) setSelectedCity(cityList[0].id)
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setShowAuth(true)
      return
    }
    if (!placeName.trim()) {
      toast.error('Укажите название заведения')
      return
    }
    if (!selectedCity) {
      toast.error('Выберите город')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/demand/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: placeName.trim(),
          categoryId: selectedCategory || undefined,
          cityId: selectedCity,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        setPlaceName('')
        toast.success('Запрос отправлен! Мы уведомим вас, когда заведение ответит.')
        // Refresh demands
        fetch('/api/demand/trending?limit=20')
          .then((r) => r.json())
          .then((data) => setDemands(data.demands || []))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Не удалось отправить запрос')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSupport = async (demandId: string) => {
    if (!user) {
      setShowAuth(true)
      return
    }
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
          prev.map((d) => d.id === demandId ? { ...d, supportCount: d.supportCount + 1 } : d)
        )
      }
    } catch {
      toast.error('Ошибка сети')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/offers" className="flex items-center gap-1 text-white/70 text-sm mb-3 hover:text-white">
            <ChevronLeft className="w-4 h-4" /> Скидки
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Запросить скидку</h1>
              <p className="text-orange-100 text-sm">Скажите заведениям, что вы хотите</p>
            </div>
          </div>
          {responseRate > 0 && (
            <div className="mt-3 bg-white/15 rounded-lg px-3 py-2 text-sm">
              <span className="font-bold">{responseRate}%</span> запросов получают ответ от заведений
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Create demand form */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-8">
          <h2 className="text-base font-bold text-gray-900 mb-1">Хочу скидку!</h2>
          <p className="text-xs text-gray-500 mb-4">Укажите заведение и мы передадим ваш запрос. Чем больше голосов — тем выше шанс получить скидку.</p>

          {submitted ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-semibold text-gray-900">Запрос отправлен!</p>
              <p className="text-sm text-gray-500 mt-1">Мы уведомим вас, когда заведение ответит</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-sm text-orange-600 font-medium hover:underline"
              >
                Создать ещё один запрос
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="Название кафе, ресторана, салона..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-orange-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="flex-1 text-sm border border-orange-200 rounded-xl px-3 py-2.5 bg-white text-gray-700"
                >
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 text-sm border border-orange-200 rounded-xl px-3 py-2.5 bg-white text-gray-700"
                  >
                    <option value="">Категория</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !placeName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Отправка...' : 'Отправить запрос'}
              </button>
            </form>
          )}
        </div>

        {/* Active demands */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Активные запросы</h2>
            <span className="text-xs text-gray-400">{demands.length} запросов</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-400">Загрузка...</div>
          ) : demands.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Пока нет запросов в вашем городе</p>
              <p className="text-sm mt-1">Будьте первым!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {demands.map((demand) => (
                <div
                  key={demand.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{demand.placeName}</p>
                      {demand.placeAddress && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{demand.placeAddress}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {demand.categoryName && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            {demand.categoryName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {demand.supportCount} {demand.supportCount === 1 ? 'хочет' : 'хотят'}
                        </span>
                        {demand.responseCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <MessageCircle className="w-3 h-3" />
                            {demand.responseCount} {demand.responseCount === 1 ? 'ответ' : 'ответа'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSupport(demand.id)}
                      className="shrink-0 flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      +1 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Support bar visualization */}
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all"
                      style={{ width: `${Math.min(demand.supportCount * 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthPrompt
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        reason="Войдите, чтобы создать или поддержать запрос на скидку"
        redirectTo="/demands"
      />
    </div>
  )
}
