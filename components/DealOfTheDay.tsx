'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface DealOfTheDayProps {
  id: string
  title: string
  merchantName: string
  branchName: string
  imageUrl: string | null
  benefitType: string
  benefitValue: number
  redemptionsTodayCount: number
}

function getBenefitLabel(benefitType: string, benefitValue: number): string {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return `${benefitValue}`
  }
}

function getTimeUntilEndOfDay(): { hours: number; minutes: number; seconds: number } {
  const now = new Date()
  // Moscow midnight = next UTC+3 midnight
  const moscow = new Date(now.getTime() + 3 * 60 * 60_000)
  const endOfDayMoscow = new Date(
    Date.UTC(moscow.getUTCFullYear(), moscow.getUTCMonth(), moscow.getUTCDate() + 1, 0, 0, 0)
  )
  const endOfDayUTC = new Date(endOfDayMoscow.getTime() - 3 * 60 * 60_000)
  const diff = Math.max(0, endOfDayUTC.getTime() - now.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { hours, minutes, seconds }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function DealOfTheDay({
  id,
  title,
  merchantName,
  branchName,
  imageUrl,
  benefitType,
  benefitValue,
  redemptionsTodayCount,
}: DealOfTheDayProps) {
  const [countdown, setCountdown] = useState(getTimeUntilEndOfDay())

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilEndOfDay())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const benefitLabel = getBenefitLabel(benefitType, benefitValue)

  return (
    <motion.section
      className="px-4 py-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔥</span>
          <h2 className="font-bold text-gray-900 text-base">Сделка дня</h2>
          <span className="text-xs bg-deal-flash text-white px-2 py-0.5 rounded-full font-medium animate-pulse badge">
            Только сегодня
          </span>
        </div>

        <Link href={`/offers/${id}`} className="block group">
          <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-900 min-h-[200px]">
            {/* Background image or gradient */}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-blue-900 opacity-90" />
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-5 flex flex-col justify-between min-h-[200px]">
              {/* Top row: benefit badge + countdown */}
              <div className="flex items-start justify-between">
                <span className="bg-deal-discount text-white text-xl font-extrabold px-3 py-1.5 rounded-xl shadow-md badge">
                  {benefitLabel}
                </span>
                <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-300 shrink-0" />
                  <span className="text-white font-mono text-sm font-semibold tabular-nums">
                    {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
                  </span>
                </div>
              </div>

              {/* Bottom: title, merchant, social proof, CTA */}
              <div className="mt-auto">
                <p className="text-white/80 text-xs mb-1 font-medium">{merchantName} &middot; {branchName}</p>
                <h3 className="text-white text-xl font-bold leading-snug mb-3 group-hover:text-blue-200 transition-colors">
                  {title}
                </h3>

                <div className="flex items-center justify-between gap-3">
                  {redemptionsTodayCount > 0 && (
                    <div className="flex items-center gap-1.5 text-white/80 text-xs">
                      <Users className="w-3.5 h-3.5" />
                      <span>{redemptionsTodayCount} {redemptionsTodayCount === 1 ? 'человек воспользовался' : redemptionsTodayCount < 5 ? 'человека воспользовались' : 'людей воспользовались'} сегодня</span>
                    </div>
                  )}
                  <span className="ml-auto shrink-0 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl shadow hover:bg-gray-100 transition-colors group-hover:shadow-md">
                    Активировать
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </motion.section>
  )
}
