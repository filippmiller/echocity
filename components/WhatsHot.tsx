'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flame, Clock, Zap, TrendingUp, AlertTriangle } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { hapticTap } from '@/lib/haptics'

interface HotOffer {
  id: string
  title: string
  subtitle: string | null
  benefitType: string
  benefitValue: number
  offerType: string
  visibility: string
  imageUrl: string | null
  branchName: string
  branchAddress: string
  nearestMetro: string | null
  isVerified: boolean
  redemptionCount: number
  maxRedemptions: number | null
  expiresAt: string | null
  isFlash: boolean
  hotReason: 'flash' | 'expiring' | 'popular_now' | 'almost_gone'
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

function getHotLabel(reason: string) {
  switch (reason) {
    case 'flash': return { icon: Zap, text: 'Flash-скидка', color: 'text-rose-600 bg-rose-50', iconColor: 'text-rose-500' }
    case 'expiring': return { icon: Clock, text: 'Скоро закончится', color: 'text-amber-700 bg-amber-50', iconColor: 'text-amber-500' }
    case 'popular_now': return { icon: TrendingUp, text: 'Популярно сейчас', color: 'text-blue-700 bg-blue-50', iconColor: 'text-blue-500' }
    case 'almost_gone': return { icon: AlertTriangle, text: 'Почти разобрали', color: 'text-orange-700 bg-orange-50', iconColor: 'text-orange-500' }
    default: return { icon: Flame, text: 'Горячее', color: 'text-red-700 bg-red-50', iconColor: 'text-red-500' }
  }
}

function getTimeLeft(expiresAt: string): string | null {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}ч ${minutes}м`
  return `${minutes}м`
}

export function WhatsHot({ city }: { city?: string }) {
  const [offers, setOffers] = useState<HotOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)

    fetch(`/api/offers/hot?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.hotOffers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city])

  if (loading || offers.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
          <Flame className="w-4 h-4 text-red-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Горячее прямо сейчас</h2>
        <span className="ml-auto text-xs text-gray-400">обновлено только что</span>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {offers.map((offer) => {
          const badge = getBenefitBadge(offer.benefitType, offer.benefitValue)
          const label = getHotLabel(offer.hotReason)
          const Icon = label.icon
          const timeLeft = offer.expiresAt ? getTimeLeft(offer.expiresAt) : null

          return (
            <Link
              key={offer.id}
              href={`/offers/${offer.id}`}
              onClick={hapticTap}
              className="flex-shrink-0 w-[260px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98] group"
            >
              {/* Image area */}
              <div className="relative h-32 bg-gradient-to-br from-red-50 to-orange-50">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-400/50">{badge}</span>
                  </div>
                )}

                {/* Discount badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-sm font-bold text-white ${offer.isFlash ? 'bg-rose-500' : 'bg-deal-discount'}`}>
                  {offer.isFlash && <Zap className="inline w-3 h-3 mr-0.5 -mt-0.5" />}
                  {badge}
                </div>

                {/* Hot reason badge */}
                <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${label.color}`}>
                  <Icon className={`w-3 h-3 ${label.iconColor}`} />
                  {label.text}
                </div>

                {/* Favorite */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  <FavoriteButton entityType="OFFER" entityId={offer.id} size="sm" />
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-brand-600">
                  {offer.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{offer.branchName}</p>

                <div className="mt-2 flex items-center gap-2 text-xs">
                  {timeLeft && (
                    <span className="text-red-500 font-medium flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {timeLeft}
                    </span>
                  )}
                  {offer.maxRedemptions && offer.redemptionCount > 0 && (
                    <span className="text-gray-400">
                      Осталось {offer.maxRedemptions - offer.redemptionCount}
                    </span>
                  )}
                  {offer.redemptionCount > 0 && (
                    <span className="text-gray-400 ml-auto">
                      {offer.redemptionCount} взяли
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
