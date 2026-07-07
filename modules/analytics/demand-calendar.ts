import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface DemandCalendarOptions {
  city?: string
  category?: string
  daysBack?: number
}

export interface DemandCalendarSlot {
  weekday: number // 0=Monday … 6=Sunday
  weekdayLabel: string
  hourBucket?: string
  redemptionCount: number
  recommendation: string
}

const WEEKDAY_LABELS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

// JS getDay(): 0=Sunday, 1=Monday... Convert to 0=Monday, 6=Sunday.
function jsDayToWeekday(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

function getHourBucket(hour: number): string {
  if (hour >= 6 && hour < 12) return 'утро (6–12)'
  if (hour >= 12 && hour < 18) return 'день (12–18)'
  if (hour >= 18 && hour < 24) return 'вечер (18–24)'
  return 'ночь (0–6)'
}

function getRecommendation(topDay: string, topBucket?: string): string {
  const timePart = topBucket ? ` в ${topBucket}` : ''
  return `${topDay} — пик активности${timePart}; запускайте акции за 1–2 дня до пика.`
}

/**
 * Build a demand calendar for a merchant (or set of merchants) based on
 * historical redemption timestamps. Aggregates by weekday and optionally by
 * 6-hour bucket when enough data exists.
 *
 * Returns the top 3 weekdays. If no redemption history exists, returns a
 * single documented fallback slot instead of fabricated precision.
 */
export async function getDemandCalendar(
  merchantIds: string[],
  options: DemandCalendarOptions = {}
): Promise<DemandCalendarSlot[]> {
  if (merchantIds.length === 0) {
    return [fallbackSlot()]
  }

  const daysBack = Math.max(7, Math.min(options.daysBack ?? 90, 365))
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  cutoff.setHours(0, 0, 0, 0)

  const branchWhere: Record<string, string> = {}
  if (options.city) branchWhere.city = options.city.trim()
  if (options.category) branchWhere.placeType = options.category.trim()

  const where: Prisma.RedemptionWhereInput = {
    merchantId: { in: merchantIds },
    status: 'SUCCESS',
    redeemedAt: { gte: cutoff },
    ...(Object.keys(branchWhere).length > 0 ? { branch: branchWhere } : {}),
  }

  const redemptions = await prisma.redemption.findMany({
    where,
    select: { redeemedAt: true },
  })

  if (redemptions.length === 0) {
    return [fallbackSlot()]
  }

  const includeHourBuckets = redemptions.length >= 30

  const counts = new Map<string, number>()
  for (const r of redemptions) {
    const date = r.redeemedAt
    const weekday = jsDayToWeekday(date.getDay())
    const key = includeHourBuckets
      ? `${weekday}|${getHourBucket(date.getHours())}`
      : `${weekday}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  // Build per-weekday totals for ranking.
  const weekdayTotals = new Map<number, number>()
  for (const [key, count] of counts) {
    const weekday = Number(key.split('|')[0])
    weekdayTotals.set(weekday, (weekdayTotals.get(weekday) || 0) + count)
  }

  const topWeekdays = Array.from(weekdayTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([weekday]) => weekday)

  const slots: DemandCalendarSlot[] = []

  for (const weekday of topWeekdays) {
    if (includeHourBuckets) {
      const bucketOrder = ['утро (6–12)', 'день (12–18)', 'вечер (18–24)', 'ночь (0–6)']
      for (const bucket of bucketOrder) {
        const count = counts.get(`${weekday}|${bucket}`) || 0
        if (count > 0) {
          slots.push({
            weekday,
            weekdayLabel: WEEKDAY_LABELS[weekday],
            hourBucket: bucket,
            redemptionCount: count,
            recommendation: '',
          })
        }
      }
    } else {
      const count = weekdayTotals.get(weekday) || 0
      slots.push({
        weekday,
        weekdayLabel: WEEKDAY_LABELS[weekday],
        redemptionCount: count,
        recommendation: '',
      })
    }
  }

  // Attach a single recommendation to the top slot.
  if (slots.length > 0) {
    const top = slots[0]
    const topBucket = top.hourBucket ? top.hourBucket.replace(/[()]/g, '').replace('–', '-') : undefined
    top.recommendation = getRecommendation(top.weekdayLabel, topBucket)
  }

  return slots
}

function fallbackSlot(): DemandCalendarSlot {
  return {
    weekday: -1,
    weekdayLabel: 'Нет данных',
    redemptionCount: 0,
    recommendation:
      'Недостаточно данных. Рекомендуем запускать в четверг–пятницу 18:00–20:00 по местному времени.',
  }
}
