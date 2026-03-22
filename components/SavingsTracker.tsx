'use client'

import { useState, useEffect } from 'react'
import { PiggyBank, TrendingUp, TrendingDown, Share2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'

interface SavingsData {
  lifetime: { rubles: number; count: number }
  thisMonth: { rubles: number; count: number }
  prevMonth: { rubles: number }
  monthOverMonth: number | null
  categories: Array<{ name: string; placeType: string; rubles: number }>
  monthlySeries: Array<{ month: string; rubles: number }>
}

const MONTH_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

function formatMonth(monthStr: string): string {
  const parts = monthStr.split('-')
  return MONTH_SHORT[parseInt(parts[1]) - 1] || monthStr
}

export function SavingsTracker() {
  const { user } = useAuth()
  const [data, setData] = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch('/api/profile/savings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleShare = async () => {
    if (!data) return
    const text = `Я сэкономил${data.lifetime.rubles.toLocaleString('ru-RU')} ₽ на ${data.lifetime.count} скидках с ГдеСейчас! 🎉`
    try {
      if (navigator.share) {
        await navigator.share({ text, url: 'https://gdesejchas.ru' })
      } else {
        await navigator.clipboard.writeText(text)
        toast.success('Скопировано для отправки')
      }
    } catch {
      // share cancelled
    }
  }

  if (!user || loading || !data) return null

  const maxCategory = Math.max(...data.categories.map((c) => c.rubles), 1)
  const maxMonth = Math.max(...data.monthlySeries.map((m) => m.rubles), 1)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mx-4 mt-4">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-8 h-8" />
            <div>
              <p className="text-emerald-100 text-xs">Всего сэкономлено</p>
              <p className="text-2xl font-bold">{data.lifetime.rubles.toLocaleString('ru-RU')} ₽</p>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Поделиться"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* This month highlight */}
        <div className="mt-3 bg-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-emerald-100 text-xs">В этом месяце</p>
            <p className="text-lg font-bold">{data.thisMonth.rubles.toLocaleString('ru-RU')} ₽</p>
          </div>
          {data.monthOverMonth !== null && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              data.monthOverMonth >= 0 ? 'bg-green-400/30 text-white' : 'bg-red-400/30 text-white'
            }`}>
              {data.monthOverMonth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {data.monthOverMonth > 0 ? '+' : ''}{data.monthOverMonth}%
            </div>
          )}
        </div>
      </div>

      {/* Monthly bar chart */}
      {data.monthlySeries.length > 1 && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">По месяцам</h3>
          <div className="flex items-end gap-2 h-24">
            {data.monthlySeries.map((m) => {
              const height = maxMonth > 0 ? (m.rubles / maxMonth) * 100 : 0
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{m.rubles > 0 ? `${m.rubles}₽` : ''}</span>
                  <div
                    className="w-full bg-emerald-400 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{formatMonth(m.month)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {data.categories.length > 0 && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">По категориям</h3>
          <div className="space-y-2">
            {data.categories.map((cat) => {
              const width = maxCategory > 0 ? (cat.rubles / maxCategory) * 100 : 0
              return (
                <div key={cat.placeType}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-600">{cat.name}</span>
                    <span className="text-xs font-medium text-gray-800">{cat.rubles.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
