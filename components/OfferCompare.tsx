'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X, Plus, ArrowRight, BadgeCheck, Star, Users, Clock } from 'lucide-react'

interface CompareOffer {
  id: string
  title: string
  benefitType: string
  benefitValue: number
  branchName: string
  branchAddress: string
  nearestMetro: string | null
  isVerified: boolean
  redemptionCount: number
  reviewCount: number
  imageUrl: string | null
  expiresAt: string | null
  visibility: string
}

function getBenefitBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    default: return `${benefitValue}`
  }
}

// LocalStorage key for comparison list
const COMPARE_KEY = 'echocity_compare'

export function useCompare() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY)
      if (stored) setIds(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const add = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id) || prev.length >= 3) return prev
      const next = [...prev, id]
      try { localStorage.setItem(COMPARE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.filter((i) => i !== id)
      try { localStorage.setItem(COMPARE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setIds([])
    try { localStorage.removeItem(COMPARE_KEY) } catch { /* ignore */ }
  }, [])

  return { ids, add, remove, clear, count: ids.length }
}

export function CompareBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  if (ids.length === 0) return null

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-brand-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <span className="text-sm font-medium">
          {ids.length} {ids.length === 1 ? 'предложение' : 'предложения'} для сравнения
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/compare?ids=${ids.join(',')}`}
            className="px-4 py-1.5 bg-white text-brand-600 rounded-lg text-sm font-semibold hover:bg-brand-50 transition-colors"
          >
            Сравнить
          </Link>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function CompareTable({ offers }: { offers: CompareOffer[] }) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-16">
        <Plus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Добавьте предложения для сравнения</p>
        <p className="text-sm text-gray-400 mt-1">Нажмите на карточке скидки для добавления</p>
      </div>
    )
  }

  const rows: Array<{ label: string; values: (string | React.ReactNode)[] }> = [
    {
      label: 'Скидка',
      values: offers.map((o) => (
        <span key={o.id} className="text-lg font-bold text-brand-600">
          {getBenefitBadge(o.benefitType, o.benefitValue)}
        </span>
      )),
    },
    {
      label: 'Заведение',
      values: offers.map((o) => (
        <div key={o.id} className="flex items-center gap-1">
          <span className="text-sm text-gray-800">{o.branchName}</span>
          {o.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
        </div>
      )),
    },
    {
      label: 'Адрес',
      values: offers.map((o) => (
        <span key={o.id} className="text-xs text-gray-500">{o.branchAddress}</span>
      )),
    },
    {
      label: 'Метро',
      values: offers.map((o) => (
        <span key={o.id} className="text-xs text-gray-500">{o.nearestMetro || '—'}</span>
      )),
    },
    {
      label: 'Использовали',
      values: offers.map((o) => (
        <span key={o.id} className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="w-3.5 h-3.5" /> {o.redemptionCount}
        </span>
      )),
    },
    {
      label: 'Отзывы',
      values: offers.map((o) => (
        <span key={o.id} className="flex items-center gap-1 text-sm text-green-600">
          <Star className="w-3.5 h-3.5" /> {o.reviewCount}
        </span>
      )),
    },
    {
      label: 'Доступ',
      values: offers.map((o) => (
        <span key={o.id} className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          o.visibility === 'MEMBERS_ONLY' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
        }`}>
          {o.visibility === 'MEMBERS_ONLY' ? 'Plus' : 'Для всех'}
        </span>
      )),
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        {/* Header with images */}
        <thead>
          <tr>
            <th className="w-32" />
            {offers.map((o) => (
              <th key={o.id} className="p-2 text-center">
                <Link href={`/offers/${o.id}`} className="block group">
                  {o.imageUrl ? (
                    <img src={o.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full h-24 bg-brand-50 rounded-lg mb-2 flex items-center justify-center text-brand-300 text-2xl font-bold">
                      {getBenefitBadge(o.benefitType, o.benefitValue)}
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 line-clamp-2">{o.title}</p>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="px-3 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">{row.label}</td>
              {row.values.map((val, j) => (
                <td key={j} className="px-3 py-2.5 text-center">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {/* Action row */}
        <tfoot>
          <tr>
            <td />
            {offers.map((o) => (
              <td key={o.id} className="p-2 text-center">
                <Link
                  href={`/offers/${o.id}`}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  Открыть <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
