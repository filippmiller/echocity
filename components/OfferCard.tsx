'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Clock, Users, Flame, Globe, Train, Star, BadgeCheck, Navigation } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { hapticTap } from '@/lib/haptics'
import { getBenefitBadge, getEstimatedSavings, getPricePair, formatPrice, buildYandexMapsRouteUrl } from '@/lib/offer-utils'
import { getScheduleStatus } from '@/lib/schedule-utils'
import type { ScheduleSlot } from '@/lib/schedule-utils'

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
  redemptionChannel?: string
  schedules?: ScheduleSlot[]
  nearestMetro?: string | null
  isVerified?: boolean
  isTrending?: boolean
  reviewCount?: number
  avgRating?: number | null
  branchLat?: number | null
  branchLng?: number | null
  metadata?: unknown
}

// Simple session-level dedup for offer impression tracking from cards.
const trackedOfferIds = new Set<string>()

function getTimeLeft(expiresAt: string): { text: string; urgent: boolean } | null {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  if (days > 7) return null
  if (days >= 1) return { text: `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`, urgent: days <= 2 }
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return { text: `${hours}ч ${minutes}м`, urgent: true }
  return { text: `${minutes}м`, urgent: true }
}

export function OfferCard({
  id, title, subtitle, benefitType, benefitValue, visibility,
  imageUrl, branchName, branchAddress, distance,
  expiresAt, redemptionCount, maxRedemptions, isFlash,
  redemptionChannel, schedules, nearestMetro, isVerified, isTrending, reviewCount,
  avgRating, branchLat, branchLng, metadata,
}: OfferCardProps) {
  const hasScheduledTrack = useRef(false)
  const badge = getBenefitBadge(benefitType, benefitValue)
  const estimatedSavings = getEstimatedSavings(benefitType, benefitValue, metadata)
  const pricePair = getPricePair(benefitType, benefitValue, metadata)
  const mapUrl = branchLat != null && branchLng != null
    ? buildYandexMapsRouteUrl(branchLat, branchLng, branchAddress)
    : null
  const isMembersOnly = visibility === 'MEMBERS_ONLY'
  const timeInfo = expiresAt ? getTimeLeft(expiresAt) : null
  const utilizationPercent = maxRedemptions && redemptionCount
    ? Math.round((redemptionCount / maxRedemptions) * 100)
    : 0
  const isAlmostGone = utilizationPercent >= 80
  const scheduleStatus = schedules && schedules.length > 0 ? getScheduleStatus(schedules) : null

  useEffect(() => {
    if (hasScheduledTrack.current || trackedOfferIds.has(id)) return
    hasScheduledTrack.current = true
    trackedOfferIds.add(id)

    const timer = setTimeout(() => {
      fetch('/api/analytics/offer-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: id, source: 'list' }),
      }).catch(() => {})
    }, 500)

    return () => clearTimeout(timer)
  }, [id])

  return (
    <Link href={`/offers/${id}`} className="block group" onClick={hapticTap}>
      <div className="grid grid-cols-[76px_1fr] gap-3 border-b ec-line py-3 transition-colors hover:bg-[color:var(--ec-surface)]/60 active:opacity-80">
        <div className="relative h-[76px] w-[76px] overflow-hidden rounded-xl bg-[color:var(--ec-surface-muted)]">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-cover saturate-[0.9]" loading="lazy" />
          ) : (
            <img
              src={`/images/offers/offer-placeholder-${id.length > 0 ? ((id.charCodeAt(id.length - 1) % 4) + 1) : 1}.jpg`}
              alt={title}
              className="h-full w-full object-cover opacity-90 saturate-[0.85]"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}

          <div className="absolute left-1.5 top-1.5 rounded-full bg-[color:var(--ec-bg)]/90 px-1.5 py-0.5 text-[10px] font-bold ec-accent-text backdrop-blur badge">
            {isFlash && <Flame className="mr-0.5 inline h-3 w-3 -mt-0.5" />}
            {badge}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--ec-text)] group-hover:ec-accent-text">
              {title}
            </h3>
            <div className="shrink-0">
              <FavoriteButton entityType="OFFER" entityId={id} size="sm" />
            </div>
          </div>
          {subtitle && (
            <p className="mt-0.5 line-clamp-1 text-xs ec-muted">{subtitle}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-xs ec-muted">
            <span className="truncate">{branchName}</span>
            {isVerified && <VerifiedBadge size="sm" />}
            {distance !== undefined && (
              <span className="shrink-0">
                · {distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}
              </span>
            )}
          </div>

          {pricePair ? (
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-base font-bold tracking-[-0.02em] text-[color:var(--ec-text)]">{formatPrice(pricePair.current)}</span>
              <span className="text-xs line-through ec-muted">{formatPrice(pricePair.original)}</span>
              {estimatedSavings != null && estimatedSavings > 0 && (
                <span className="text-xs font-semibold text-[color:var(--ec-accent-2)]">
                  {formatPrice(estimatedSavings)}
                </span>
              )}
            </div>
          ) : estimatedSavings != null && estimatedSavings > 0 ? (
            <div className="mt-1.5 text-xs font-semibold text-[color:var(--ec-accent-2)]">
              Выгода до {formatPrice(estimatedSavings)}
            </div>
          ) : null}

          {nearestMetro && (
            <div className="mt-0.5 flex items-center gap-1 text-xs ec-muted">
              <Train className="w-3 h-3 shrink-0" />
              <span className="truncate">{nearestMetro}</span>
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-2 overflow-hidden text-xs ec-muted">
            {scheduleStatus?.kind === 'open_now' && (
              <span className="shrink-0 font-medium text-[color:var(--ec-accent-2)]">сейчас</span>
            )}
            {scheduleStatus?.kind === 'opens_today' && (
              <span className="shrink-0 font-medium text-[color:var(--ec-warning)]">с {scheduleStatus.startTime}</span>
            )}
            {timeInfo && (
              <span className="flex shrink-0 items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeInfo.text}
              </span>
            )}
            {avgRating != null && avgRating > 0 && (
              <span className="flex shrink-0 items-center gap-1">
                <Star className="h-3 w-3" />
                {avgRating}
              </span>
            )}
            {redemptionCount !== undefined && redemptionCount > 0 && (
              <span className="flex shrink-0 items-center gap-1">
                <Users className="h-3 w-3" />
                {redemptionCount}
              </span>
            )}
            {isMembersOnly && <span className="shrink-0">Plus</span>}
            {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && <Globe className="h-3 w-3 shrink-0" />}
          </div>
        </div>
      </div>
    </Link>
  )
}
