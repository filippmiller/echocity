'use client'

import Link from 'next/link'
import { Clock, Users, Flame, Globe, Train } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { hapticTap } from '@/lib/haptics'

interface ScheduleSlot {
  weekday: number   // 0=Monday..6=Sunday
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
}

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
}

type ScheduleStatus =
  | { kind: 'open_now' }
  | { kind: 'opens_today'; startTime: string }
  | { kind: 'tomorrow' }
  | { kind: 'no_schedule' }

function getMoscowInfo(): { weekday: number; timeStr: string } {
  const now = new Date()
  const moscow = new Date(now.getTime() + 3 * 60 * 60_000)
  const weekday = (moscow.getUTCDay() + 6) % 7 // 0=Monday
  const timeStr = `${String(moscow.getUTCHours()).padStart(2, '0')}:${String(moscow.getUTCMinutes()).padStart(2, '0')}`
  return { weekday, timeStr }
}

function getScheduleStatus(schedules: ScheduleSlot[]): ScheduleStatus {
  if (!schedules || schedules.length === 0) return { kind: 'no_schedule' }
  const { weekday, timeStr } = getMoscowInfo()
  // Check if open right now
  const openNow = schedules.some((s) => s.weekday === weekday && s.startTime <= timeStr && s.endTime > timeStr)
  if (openNow) return { kind: 'open_now' }
  // Check if opens later today
  const laterToday = schedules
    .filter((s) => s.weekday === weekday && s.startTime > timeStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
  if (laterToday) return { kind: 'opens_today', startTime: laterToday.startTime }
  // Check if tomorrow
  const tomorrow = (weekday + 1) % 7
  const hasTomorrow = schedules.some((s) => s.weekday === tomorrow)
  if (hasTomorrow) return { kind: 'tomorrow' }
  return { kind: 'no_schedule' }
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
  redemptionChannel, schedules, nearestMetro, isVerified, isTrending,
}: OfferCardProps) {
  const badge = getBenefitBadge(benefitType, benefitValue)
  const isMembersOnly = visibility === 'MEMBERS_ONLY'
  const timeInfo = expiresAt ? getTimeLeft(expiresAt) : null
  const utilizationPercent = maxRedemptions && redemptionCount
    ? Math.round((redemptionCount / maxRedemptions) * 100)
    : 0
  const isAlmostGone = utilizationPercent >= 80
  const scheduleStatus = schedules && schedules.length > 0 ? getScheduleStatus(schedules) : null

  return (
    <Link href={`/offers/${id}`} className="block group" onClick={hapticTap}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[16/10] bg-gray-100">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center ${
              isFlash ? 'bg-gradient-to-br from-rose-100 to-orange-100' :
              isMembersOnly ? 'bg-gradient-to-br from-violet-100 to-purple-100' :
              'bg-gradient-to-br from-blue-50 to-indigo-100'
            }`}>
              <span className="text-3xl font-bold text-gray-400/60">{badge}</span>
              <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{branchName.split(' — ')[0]}</span>
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

          {/* Online badge */}
          {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && (
            <div className={`absolute ${isMembersOnly ? 'top-8' : 'top-2'} right-10 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-semibold badge flex items-center gap-0.5`}>
              <Globe className="w-3 h-3" />
              Online
            </div>
          )}

          {/* Trending badge */}
          {isTrending && (
            <div className="absolute top-2 left-2 mt-7 px-2 py-0.5 rounded text-xs font-semibold badge bg-amber-400 text-white flex items-center gap-0.5 leading-tight">
              🔥 Популярно
            </div>
          )}

          {/* Favorite button */}
          <div className="absolute top-1.5 right-1.5 z-10">
            <FavoriteButton entityType="OFFER" entityId={id} size="sm" />
          </div>

          {/* Urgency bar */}
          {(timeInfo || isAlmostGone) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 flex items-center gap-2">
              {timeInfo && (
                <span className={`flex items-center gap-1 text-xs font-medium badge ${timeInfo.urgent ? 'text-deal-urgent' : 'text-white'}`}>
                  <Clock className="w-3 h-3" />
                  {timeInfo.text}
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
          {/* Schedule availability indicator */}
          {scheduleStatus && (
            <div className="mt-1">
              {scheduleStatus.kind === 'open_now' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 badge">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                  Сейчас
                </span>
              )}
              {scheduleStatus.kind === 'opens_today' && (
                <span className="text-xs text-orange-500 font-medium badge">
                  Сегодня с {scheduleStatus.startTime}
                </span>
              )}
              {scheduleStatus.kind === 'tomorrow' && (
                <span className="text-xs text-gray-400 badge">Завтра</span>
              )}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1 truncate max-w-[60%]">
              <span className="truncate">{branchName}</span>
              {isVerified && <VerifiedBadge size="sm" />}
            </span>
            {distance !== undefined && (
              <span className="shrink-0 font-medium text-gray-600">
                {distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}
              </span>
            )}
          </div>
          {nearestMetro && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <Train className="w-3 h-3 shrink-0" />
              <span className="truncate">{nearestMetro}</span>
            </div>
          )}
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
