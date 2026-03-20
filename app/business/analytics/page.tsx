export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import RedemptionHeatmap from '@/components/RedemptionHeatmap'

function formatRubles(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100)
  return rubles.toLocaleString('ru-RU') + ' \u20BD'
}

export default async function BusinessAnalyticsPage() {
  const session = await getSession()

  if (!session) redirect('/auth/login')
  if (session.role !== 'BUSINESS_OWNER') redirect('/')

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })

  const merchantIds = businesses.map((b) => b.id)

  if (merchantIds.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Аналитика</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 mb-4">У вас пока нет заведений</p>
          <Link
            href="/business/register"
            className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Зарегистрировать первое
          </Link>
        </div>
      </div>
    )
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  // Run all queries in parallel
  const [
    redemptionsRecent,
    allOffers,
    offerRedemptionCounts,
    offerRatings,
    allTimeRedemptionsByUser,
    savingsAggregate,
    totalDemands,
    respondedDemands,
    fulfilledDemands,
    totalRedemptions,
    uniqueCustomers,
    overallAvgRating,
    categoryAvgDiscount,
  ] = await Promise.all([
    prisma.redemption.findMany({
      where: {
        merchantId: { in: merchantIds },
        status: 'SUCCESS',
        redeemedAt: { gte: fourWeeksAgo },
      },
      select: { redeemedAt: true, userId: true },
    }),
    prisma.offer.findMany({
      where: { merchantId: { in: merchantIds } },
      select: { id: true, title: true, benefitType: true, benefitValue: true },
    }),
    prisma.redemption.groupBy({
      by: ['offerId'],
      _count: { id: true },
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),
    prisma.offerReview.groupBy({
      by: ['offerId'],
      _avg: { rating: true },
      _count: { id: true },
      where: {
        offer: { merchantId: { in: merchantIds } },
        isPublished: true,
      },
    }),
    prisma.redemption.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),
    prisma.redemption.aggregate({
      _sum: { discountAmount: true },
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),
    prisma.demandRequest.count({
      where: { place: { businessId: { in: merchantIds } } },
    }),
    prisma.demandResponse.count({
      where: { merchantId: { in: merchantIds } },
    }),
    prisma.demandRequest.count({
      where: { place: { businessId: { in: merchantIds } }, status: 'FULFILLED' },
    }),
    prisma.redemption.count({
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),
    prisma.redemption.groupBy({
      by: ['userId'],
      where: { merchantId: { in: merchantIds }, status: 'SUCCESS' },
    }),
    prisma.offerReview.aggregate({
      _avg: { rating: true },
      where: { offer: { merchantId: { in: merchantIds } }, isPublished: true },
    }),
    // Category comparison: avg PERCENT discount across ALL merchants
    prisma.offer.aggregate({
      _avg: { benefitValue: true },
      where: { benefitType: 'PERCENT', approvalStatus: 'APPROVED' },
    }),
  ])

  // === Summary stats ===
  const totalUniqueCustomers = uniqueCustomers.length
  const avgRating = overallAvgRating._avg.rating
    ? Math.round(overallAvgRating._avg.rating * 10) / 10
    : null
  const totalSavingsKopecks = savingsAggregate._sum.discountAmount
    ? Math.round(Number(savingsAggregate._sum.discountAmount) * 100)
    : 0

  // === Hourly heatmap ===
  const hourlyMap: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0
  const monthRedemptions = redemptionsRecent.filter((r) => r.redeemedAt >= monthStart)
  for (const r of monthRedemptions) {
    hourlyMap[r.redeemedAt.getHours()] = (hourlyMap[r.redeemedAt.getHours()] || 0) + 1
  }
  const maxHourly = Math.max(...Object.values(hourlyMap), 1)

  // === Weekly trend ===
  const weeklyTrend: { label: string; count: number }[] = []
  for (let w = 3; w >= 0; w--) {
    const wStart = new Date(now)
    wStart.setDate(wStart.getDate() - (w + 1) * 7)
    wStart.setHours(0, 0, 0, 0)
    const wEnd = new Date(now)
    wEnd.setDate(wEnd.getDate() - w * 7)
    wEnd.setHours(23, 59, 59, 999)

    const count = redemptionsRecent.filter(
      (r) => r.redeemedAt >= wStart && r.redeemedAt <= wEnd
    ).length

    weeklyTrend.push({
      label: `${wStart.getDate()}.${String(wStart.getMonth() + 1).padStart(2, '0')}`,
      count,
    })
  }
  const maxWeekly = Math.max(...weeklyTrend.map((w) => w.count), 1)

  // === Offer performance ===
  const redemptionCountMap = new Map(
    offerRedemptionCounts.map((r) => [r.offerId, r._count.id])
  )
  const ratingMap = new Map(
    offerRatings.map((r) => [r.offerId, { avg: r._avg.rating, count: r._count.id }])
  )
  const offerPerformance = allOffers
    .map((offer) => ({
      id: offer.id,
      title: offer.title,
      redemptions: redemptionCountMap.get(offer.id) || 0,
      avgRating: ratingMap.get(offer.id)?.avg
        ? Math.round((ratingMap.get(offer.id)?.avg || 0) * 10) / 10
        : null,
      reviewCount: ratingMap.get(offer.id)?.count || 0,
      benefitType: offer.benefitType,
      benefitValue: Number(offer.benefitValue),
    }))
    .sort((a, b) => b.redemptions - a.redemptions)
    .slice(0, 10)

  // === Customer retention ===
  const totalCust = allTimeRedemptionsByUser.length
  const returningCust = allTimeRedemptionsByUser.filter((u) => u._count.id > 1).length
  const retentionRate = totalCust > 0 ? Math.round((returningCust / totalCust) * 100) : 0
  const newCust = totalCust - returningCust

  // === Demand stats ===
  const demandConversion = totalDemands > 0 ? Math.round((fulfilledDemands / totalDemands) * 100) : 0

  // === Category comparison ===
  const myPercentOffers = allOffers.filter((o) => o.benefitType === 'PERCENT')
  const myAvgDiscount =
    myPercentOffers.length > 0
      ? Math.round(
          myPercentOffers.reduce((sum, o) => sum + Number(o.benefitValue), 0) /
            myPercentOffers.length
        )
      : null
  const categoryAvg =
    categoryAvgDiscount._avg.benefitValue
      ? Math.round(Number(categoryAvgDiscount._avg.benefitValue))
      : null

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
        <Link
          href="/business/dashboard"
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          Назад
        </Link>
      </div>

      {/* (a) Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Использований</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalRedemptions}</p>
          <p className="text-xs text-gray-400 mt-0.5">всего</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Клиентов</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{totalUniqueCustomers}</p>
          <p className="text-xs text-gray-400 mt-0.5">уникальных</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Средняя оценка</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">
            {avgRating !== null ? (
              <span className="flex items-center gap-1">
                {avgRating}
                <svg className="w-5 h-5 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            ) : (
              '\u2014'
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Экономия клиентам</p>
          <p className="text-2xl font-bold text-deal-savings mt-1">
            {totalSavingsKopecks > 0 ? formatRubles(totalSavingsKopecks) : '\u2014'}
          </p>
        </div>
      </div>

      {/* (b1) 7×24 Redemption heatmap — client component */}
      <RedemptionHeatmap />

      {/* (b2) Repeat customer rate card + category comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Repeat customers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Постоянные клиенты</h2>
          <p className="text-xs text-gray-400 mb-3">Доля пользователей с более чем 1 использованием</p>
          {totalCust === 0 ? (
            <p className="text-sm text-gray-400">Нет данных</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-brand-600">{retentionRate}%</div>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium text-gray-900">{returningCust}</span> повторных</p>
                <p><span className="font-medium text-gray-900">{newCust}</span> новых</p>
              </div>
            </div>
          )}
        </div>

        {/* Category comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Сравнение со средним</h2>
          <p className="text-xs text-gray-400 mb-3">Только для предложений с процентной скидкой</p>
          {myAvgDiscount === null ? (
            <p className="text-sm text-gray-400">Нет предложений со скидкой в %</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ваша средняя скидка</span>
                <span className="font-bold text-gray-900">-{myAvgDiscount}%</span>
              </div>
              {categoryAvg !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Средняя по платформе</span>
                  <span className="font-medium text-gray-500">-{categoryAvg}%</span>
                </div>
              )}
              {categoryAvg !== null && myAvgDiscount < categoryAvg && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                  Ваши скидки ниже среднего. Повышение скидки до -{categoryAvg}% может увеличить количество использований.
                </p>
              )}
              {categoryAvg !== null && myAvgDiscount >= categoryAvg && (
                <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 mt-2">
                  Ваши скидки выше среднего по платформе — отличный результат!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* (b3) Hourly heatmap (legacy bar chart) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Активность по часам (текущий месяц)</h2>
        <div className="flex items-end gap-[3px] h-24">
          {Array.from({ length: 24 }, (_, h) => {
            const count = hourlyMap[h] || 0
            const height = Math.max(4, Math.round((count / maxHourly) * 80))
            const isTop = count === maxHourly && count > 0
            return (
              <div key={h} className="flex flex-col items-center flex-1 gap-0.5">
                {count > 0 && (
                  <span className="text-[9px] text-gray-400">{count}</span>
                )}
                <div
                  className={`w-full rounded-sm transition-all ${
                    isTop ? 'bg-brand-500' : count > 0 ? 'bg-brand-300' : 'bg-gray-100'
                  }`}
                  style={{ height: `${height}px` }}
                />
                {h % 3 === 0 && (
                  <span className="text-[9px] text-gray-400">{h}:00</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* (c) Weekly trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Использований за 4 недели</h2>
        <div className="flex items-end gap-3 h-28">
          {weeklyTrend.map((week, idx) => {
            const height = Math.max(8, Math.round((week.count / maxWeekly) * 96))
            return (
              <div key={idx} className="flex flex-col items-center flex-1 gap-1">
                <span className="text-xs font-medium text-gray-700">{week.count}</span>
                <div
                  className="w-full rounded-md bg-brand-400"
                  style={{ height: `${height}px` }}
                />
                <span className="text-xs text-gray-400">{week.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* (d) Offer performance table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Эффективность предложений</h2>
        </div>
        {offerPerformance.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">
            Нет данных по предложениям
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Предложение</th>
                  <th className="px-3 py-3 font-medium text-center">Использований</th>
                  <th className="px-3 py-3 font-medium text-center">Оценка</th>
                  <th className="px-3 py-3 font-medium text-center">Отзывов</th>
                  <th className="px-5 py-3 font-medium text-right">Скидка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offerPerformance.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {offer.title}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700">{offer.redemptions}</td>
                    <td className="px-3 py-3 text-center">
                      {offer.avgRating !== null ? (
                        <span className="inline-flex items-center gap-0.5 text-yellow-600 font-medium">
                          {offer.avgRating}
                          <svg className="w-3.5 h-3.5 fill-yellow-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-gray-300">&mdash;</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-500">{offer.reviewCount}</td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {offer.benefitType === 'PERCENT'
                        ? `${offer.benefitValue}%`
                        : offer.benefitType === 'FIXED_AMOUNT'
                          ? formatRubles(offer.benefitValue * 100)
                          : offer.benefitType === 'FIXED_PRICE'
                            ? formatRubles(offer.benefitValue * 100)
                            : `${offer.benefitValue}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom row: retention + demand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* (e) Customer retention card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Удержание клиентов</h2>
          {totalCust === 0 ? (
            <p className="text-sm text-gray-400">Нет данных</p>
          ) : (
            <>
              {/* Visual donut approximation */}
              <div className="flex items-center gap-5 mb-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18" cy="18" r="15.9155"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    {/* Returning customers arc */}
                    <circle
                      cx="18" cy="18" r="15.9155"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray={`${retentionRate} ${100 - retentionRate}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{retentionRate}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm text-gray-600">
                      Повторные: <span className="font-medium text-gray-900">{returningCust}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                    <span className="text-sm text-gray-600">
                      Новые: <span className="font-medium text-gray-900">{newCust}</span>
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Всего уникальных клиентов: {totalCust}
              </p>
            </>
          )}
        </div>

        {/* (f) Demand insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Запросы от пользователей</h2>
          {totalDemands === 0 ? (
            <p className="text-sm text-gray-400">Запросов пока не поступало</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Всего запросов</span>
                <span className="text-sm font-semibold text-gray-900">{totalDemands}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Отвечено</span>
                <span className="text-sm font-semibold text-gray-900">{respondedDemands}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Выполнено</span>
                <span className="text-sm font-semibold text-deal-savings">{fulfilledDemands}</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Конверсия</span>
                  <span className="text-sm font-bold text-brand-600">{demandConversion}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(demandConversion, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
