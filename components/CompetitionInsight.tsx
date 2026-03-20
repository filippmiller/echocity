'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Tag, Lightbulb } from 'lucide-react'

interface CompetitionData {
  categoryLabel: string
  categoryType: string
  merchant: {
    avgDiscount: number
    activeOffers: number
    avgRedemptionsPerOffer: number
  }
  category: {
    avgDiscount: number
    activeOffers: number
    avgRedemptionsPerOffer: number
    merchantCount: number
  }
  suggestion: string | null
}

function ComparisonBar({
  label,
  merchantValue,
  categoryValue,
  unit,
  icon: Icon,
}: {
  label: string
  merchantValue: number
  categoryValue: number
  unit: string
  icon: React.ElementType
}) {
  const max = Math.max(merchantValue, categoryValue, 1)
  const merchantPct = Math.round((merchantValue / max) * 100)
  const categoryPct = Math.round((categoryValue / max) * 100)
  const isAbove = merchantValue >= categoryValue

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>

      {/* Merchant bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Вы</span>
          <span className={`font-semibold ${isAbove ? 'text-deal-savings' : 'text-gray-700'}`}>
            {merchantValue}{unit}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isAbove ? 'bg-deal-savings' : 'bg-brand-400'}`}
            style={{ width: `${merchantPct}%` }}
          />
        </div>
      </div>

      {/* Category bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Среднее по категории</span>
          <span className="font-medium text-gray-500">{categoryValue}{unit}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-300 transition-all duration-500"
            style={{ width: `${categoryPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function CompetitionInsight() {
  const [data, setData] = useState<CompetitionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/business/analytics/competition')
      .then((r) => {
        if (!r.ok) throw new Error('failed')
        return r.json()
      })
      .then((d) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
        <div className="space-y-3">
          <div className="h-14 bg-gray-100 rounded-lg" />
          <div className="h-14 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  // Silently hide if no data or error
  if (error || !data) return null

  const isAboveAvgDiscount = data.merchant.avgDiscount >= data.category.avgDiscount
  const suggestionIsPositive = data.suggestion?.startsWith('Отлично')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-gray-900">Позиция в категории</h3>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {data.categoryLabel}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Competitor count */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span>
            Анализ на основе {data.category.merchantCount}{' '}
            {data.category.merchantCount === 1
              ? 'заведения'
              : data.category.merchantCount < 5
              ? 'заведений'
              : 'заведений'}{' '}
            в категории
          </span>
        </div>

        {/* Comparison bars */}
        <div className="space-y-4">
          <ComparisonBar
            label="Средняя скидка"
            merchantValue={data.merchant.avgDiscount}
            categoryValue={data.category.avgDiscount}
            unit="%"
            icon={Tag}
          />
          <ComparisonBar
            label="Активаций в месяц (на предложение)"
            merchantValue={data.merchant.avgRedemptionsPerOffer}
            categoryValue={data.category.avgRedemptionsPerOffer}
            unit=" акт."
            icon={Users}
          />
        </div>

        {/* Contextual suggestion */}
        {data.suggestion && (
          <div
            className={`flex items-start gap-2.5 rounded-lg p-3 text-sm ${
              suggestionIsPositive
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{data.suggestion}</span>
          </div>
        )}

        {/* Active offers count */}
        <div className="text-xs text-gray-400 text-right">
          Активных предложений у вас: {data.merchant.activeOffers} ·
          В категории всего: {data.category.activeOffers}
        </div>
      </div>
    </div>
  )
}
