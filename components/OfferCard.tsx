'use client'

import Link from 'next/link'

interface OfferCardProps {
  id: string
  title: string
  subtitle?: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl?: string | null
  branchName: string
  branchAddress: string
  distance?: number
  isActive?: boolean
}

function getBenefitBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${benefitValue / 100}\u20BD`
    case 'FIXED_PRICE': return `${benefitValue / 100}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return `${benefitValue}`
  }
}

function getVisibilityLabel(visibility: string) {
  switch (visibility) {
    case 'FREE_FOR_ALL': return null
    case 'MEMBERS_ONLY': return 'Plus'
    case 'PUBLIC': return null
    default: return null
  }
}

export function OfferCard({ id, title, subtitle, benefitType, benefitValue, visibility, imageUrl, branchName, branchAddress, distance }: OfferCardProps) {
  const badge = getBenefitBadge(benefitType, benefitValue)
  const memberBadge = getVisibilityLabel(visibility)

  return (
    <Link href={`/offers/${id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-40 bg-gray-100">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">%</div>
          )}
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
            {badge}
          </div>
          {memberBadge && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-medium">
              {memberBadge}
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 line-clamp-1">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{subtitle}</p>}
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <span className="truncate">{branchName}</span>
            {distance !== undefined && (
              <span className="shrink-0 ml-auto">{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{branchAddress}</p>
        </div>
      </div>
    </Link>
  )
}
