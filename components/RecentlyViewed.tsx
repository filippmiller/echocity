'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { History } from 'lucide-react'
import { getRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed'
import { hapticTap } from '@/lib/haptics'

function getBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    default: return `${benefitValue}`
  }
}

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    setItems(getRecentlyViewed())
  }, [])

  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-gray-400" />
        <h2 className="text-base font-bold text-gray-900">Вы недавно смотрели</h2>
      </div>

      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/offers/${item.id}`}
            onClick={hapticTap}
            className="flex-shrink-0 flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 pr-4 hover:shadow-md transition-all group max-w-[240px]"
          >
            <div className="w-11 h-11 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" loading="lazy" />
              ) : (
                <span className="text-xs font-bold text-brand-600">{getBadge(item.benefitType, item.benefitValue)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate group-hover:text-brand-600">{item.title}</p>
              <p className="text-[10px] text-gray-400 truncate">{item.branchName}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
