'use client'

import Link from 'next/link'
import { Clock, Users, Flame } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'

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
  expiresAt?: string | null
  redemptionCount?: number
  maxRedemptions?: number | null
  isFlash?: boolean
}

function getBenefitBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return `${benefitValue}`
  }
}

function getTimeLeft(expiresAt: string): string | null {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0 || diff > 86400000) return null
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}ч ${minutes}м`
  return `${minutes}м`
}

export function OfferCard({
  id, title, subtitle, benefitType, benefitValue, visibility,
  imageUrl, branchName, branchAddress, distance,
  expiresAt, redemptionCount, maxRedemptions, isFlash,
}: OfferCardProps) {
  const badge = getBenefitBadge(benefitType, benefitValue)
  const isMembersOnly = visibility === 'MEMBERS_ONLY'
  const timeLeft = expiresAt ? getTimeLeft(expiresAt) : null
  const utilizationPercent = maxRedemptions && redemptionCount
    ? Math.round((redemptionCount / maxRedemptions) * 100)
    : 0
  const isAlmostGone = utilizationPercent >= 80

  return (
    <Link href={`/offers/${id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[16/10] bg-gray-100">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl text-gray-300">%</span>
            </div>
          )}

          {/* Discount badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-sm font-bold text-white badge ${
            isFlash ? 'bg-deal-flash' : 'bg-deal-discount'
          }`}>
            {isFlash && <Flame className="inline w-3.5 h-3.5 mr-0.5 -mt-0.5" />}
            {badge}
          </div>

          {/* Plus badge */}
          {isMembersOnly && (
            <div className="absolute top-2 right-10 bg-deal-premium text-white px-2 py-0.5 rounded text-xs font-semibold badge">
              Plus
            </div>
          )}

          {/* Favorite button */}
          <div className="absolute top-1.5 right-1.5 z-10">
            <FavoriteButton entityType="OFFER" entityId={id} size="sm" />
          </div>

          {/* Urgency bar */}
          {(timeLeft || isAlmostGone) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 flex items-center gap-2">
              {timeLeft && (
                <span className="flex items-center gap-1 text-xs font-medium text-deal-urgent badge">
                  <Clock className="w-3 h-3" />
                  {timeLeft}
                </span>
              )}
              {isAlmostGone && maxRedemptions && redemptionCount !== undefined && (
                <span className="flex items-center gap-1 text-xs font-medium text-white badge">
                  Осталось {maxRedemptions - (redemptionCount || 0)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-600">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{subtitle}</p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="truncate max-w-[60%]">{branchName}</span>
            {distance !== undefined && (
              <span className="shrink-0 font-medium text-gray-600">
                {distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}
              </span>
            )}
          </div>
          {redemptionCount !== undefined && redemptionCount > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              <span>{redemptionCount} использовали</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
