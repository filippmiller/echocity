'use client'

import Link from 'next/link'
import { MapPin, Tag, Calendar } from 'lucide-react'

interface BundlePlace {
  id: string
  title: string
  address: string
  city: string
}

interface BundleItem {
  id: string
  itemTitle: string
  place: BundlePlace
  merchant: { id: string; name: string }
}

interface BundleCardProps {
  id: string
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  totalPrice?: number | null
  discountPercent?: number | null
  items: BundleItem[]
  validUntil?: string | null
  redemptionCount?: number
}

function formatPrice(kopecks: number): string {
  return Math.floor(kopecks / 100).toLocaleString('ru-RU') + ' \u20BD'
}

export function BundleCard({
  id,
  title,
  subtitle,
  imageUrl,
  totalPrice,
  discountPercent,
  items,
  validUntil,
  redemptionCount,
}: BundleCardProps) {
  const maxShown = 3
  const shownPlaces = items.slice(0, maxShown)
  const extraCount = items.length - maxShown

  return (
    <Link href={`/bundles/${id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[16/10] bg-gray-100">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
              <span className="text-4xl">&#x1F381;</span>
            </div>
          )}

          {/* Discount / Price badge */}
          {discountPercent ? (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-sm font-bold text-white bg-green-600 badge">
              -{discountPercent}%
            </div>
          ) : totalPrice ? (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-sm font-bold text-white bg-brand-600 badge">
              {formatPrice(totalPrice)}
            </div>
          ) : null}

          {/* Bundle badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 badge">
            {items.length} заведений
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-600">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{subtitle}</p>
          )}

          {/* Participating places */}
          <div className="mt-2 space-y-1">
            {shownPlaces.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">{item.place.title}</span>
              </div>
            ))}
            {extraCount > 0 && (
              <div className="text-xs text-brand-600 font-medium">
                +{extraCount} ещё
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            {validUntil && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                до {new Date(validUntil).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {redemptionCount !== undefined && redemptionCount > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {redemptionCount} использовали
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
