export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { getBusinessAccessSummary } from '@/lib/business-access'
import { canManageOffers, canManageStaff, canScanRedemptions } from '@/lib/permissions'
import Link from 'next/link'
import { DemandSuggestionBanner } from '@/components/DemandSuggestionBanner'
import { CompetitionInsight } from '@/components/CompetitionInsight'

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function formatRubles(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100)
  return rubles.toLocaleString('ru-RU') + ' \u20BD'
}

export default async function BusinessDashboardPage() {
  const session = await getSession()

  if (!session) redirect('/auth/login')

  const { merchantIds, access } = await getBusinessAccessSummary(session)
  if (!canScanRedemptions(access)) redirect('/')

  const businesses = await prisma.business.findMany({
    where: { id: { in: merchantIds } },
    include: {
      places: { where: { isActive: true }, take: 5, orderBy: { createdAt: 'desc' } },
      _count: { select: { places: true, offers: true, redemptions: true } },
    },
  })
  const totalPlaces = businesses.reduce((sum, biz) => sum + biz._count.places, 0)
  const totalOffers = businesses.reduce((sum, biz) => sum + biz._count.offers, 0)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)

  // Run base analytics queries in parallel
  const [
    todayRedemptions,
    weeklyUniqueUsers,
    avgOrderResult,
    monthlyRedemptions,
    allRedemptionsMonth,
  ] = await Promise.all([
    prisma.redemption.count({
      where: { merchantId: { in: merchantIds }, redeemedAt: { gte: todayStart } },
    }),
    prisma.redemption.groupBy({
      by: ['userId'],
      where: { merchantId: { in: merchantIds }, redeemedAt: { gte: weekStart } },
    }),
    // Average order amount (only where orderAmount is set)
    prisma.redemption.aggregate({
      _avg: { orderAmount: true },
      _count: true,
      where: {
        merchantId: { in: merchantIds },
        orderAmount: { not: null },
        status: 'SUCCESS',
      },
    }),
    // Monthly redemptions with userId for repeat analysis
    prisma.redemption.groupBy({
      by: ['userId'],
      _count: { userId: true },
      where: {
        merchantId: { in: merchantIds },
        redeemedAt: { gte: monthStart },
        status: 'SUCCESS',
      },
    }),
    // All redemptions this month with day of week for peak day analysis
    prisma.redemption.findMany({
      where: {
        merchantId: { in: merchantIds },
        redeemedAt: { gte: monthStart },
        status: 'SUCCESS',
      },
      select: { redeemedAt: true },
    }),
  ])

  const offerIds =
    merchantIds.length > 0
      ? (await prisma.offer.findMany({
          where: { merchantId: { in: merchantIds } },
          select: { id: true },
        })).map((offer) => offer.id)
      : []

  // Offer impressions and saves depend on the merchant's offer IDs
  const [overallViews, overallSaves] =
    offerIds.length > 0
      ? await Promise.all([
          prisma.offerView.count({
            where: { offerId: { in: offerIds } },
          }),
          prisma.offerSave.count({
            where: { offerId: { in: offerIds } },
          }),
        ])
      : [0, 0]

  // Average check calculation
  const avgCheck = avgOrderResult._avg.orderAmount
    ? Math.round(Number(avgOrderResult._avg.orderAmount) * 100) // convert to kopecks
    : 0

  // New vs repeat customers this month
  const newCustomers = monthlyRedemptions.filter((r) => r._count.userId === 1).length
  const repeatCustomers = monthlyRedemptions.filter((r) => r._count.userId > 1).length

  // Peak day of week
  const dayCountMap: Record<number, number> = {}
  for (const r of allRedemptionsMonth) {
    const day = r.redeemedAt.getDay()
    dayCountMap[day] = (dayCountMap[day] || 0) + 1
  }
  let peakDay = -1
  let peakCount = 0
  for (const [day, count] of Object.entries(dayCountMap)) {
    if (count > peakCount) {
      peakDay = Number(day)
      peakCount = count
    }
  }
  const peakDayName = peakDay >= 0 ? DAY_NAMES_RU[peakDay] : null

  return (
    <div className="px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#9b9a94]">business console</p>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#f4f1ea]">Операционный день</h1>
        </div>
        <span className="rounded-full border border-[#282d34] bg-[#11161c] px-3 py-1.5 text-xs font-semibold text-[#d6b56d]">
          сегодня · {todayRedemptions} активаций
        </span>
      </div>

      {/* Demand-driven suggestions */}
      <DemandSuggestionBanner />

      {/* Competition insight */}
      <CompetitionInsight />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-5 lg:grid-cols-6">
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-[11px] font-medium text-[#9b9a94]">Точек</p>
          <p className="text-2xl font-semibold text-[#f4f1ea] mt-1">{totalPlaces}</p>
        </div>
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-[11px] font-medium text-[#9b9a94]">Предложений</p>
          <p className="text-2xl font-semibold text-[#f4f1ea] mt-1">{totalOffers}</p>
        </div>
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-[11px] font-medium text-[#9b9a94]">Сегодня</p>
          <p className="text-2xl font-semibold text-[#80c7a3] mt-1">{todayRedemptions}</p>
          <p className="text-xs text-[#9b9a94] mt-0.5">использований</p>
        </div>
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-[11px] font-medium text-[#9b9a94]">За неделю</p>
          <p className="text-2xl font-semibold text-[#d6b56d] mt-1">{weeklyUniqueUsers.length}</p>
          <p className="text-xs text-[#9b9a94] mt-0.5">уник. клиентов</p>
        </div>
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-[11px] font-medium text-[#9b9a94]">Просмотры</p>
          <p className="text-2xl font-semibold text-[#f4f1ea] mt-1">{overallViews}</p>
          <p className="text-xs text-[#9b9a94] mt-0.5">по офферам</p>
        </div>
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-[11px] font-medium text-[#9b9a94]">Сохранения</p>
          <p className="text-2xl font-semibold text-[#d6b56d] mt-1">{overallSaves}</p>
          <p className="text-xs text-[#9b9a94] mt-0.5">в избранное</p>
        </div>
      </div>

      {/* Enhanced analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Average check */}
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-xs font-medium text-[#9b9a94]">Средний чек</p>
          <p className="text-2xl font-semibold text-[#f4f1ea] mt-1">
            {avgCheck > 0 ? formatRubles(avgCheck) : '\u2014'}
          </p>
          {avgOrderResult._count > 0 && (
            <p className="text-xs text-[#9b9a94] mt-0.5">
              на основе {avgOrderResult._count} заказов
            </p>
          )}
        </div>

        {/* New vs repeat */}
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-xs font-medium text-[#9b9a94]">Клиенты за месяц</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-[#f4f1ea]">{newCustomers}</span>
            <span className="text-sm text-[#9b9a94]">новых</span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-semibold text-[#d6b56d]">{repeatCustomers}</span>
            <span className="text-sm text-[#9b9a94]">повторных</span>
          </div>
        </div>

        {/* Peak day */}
        <div className="rounded-xl border border-[#282d34] bg-[#11161c] p-3">
          <p className="text-xs font-medium text-[#9b9a94]">Конверсия по дням</p>
          {peakDayName ? (
            <>
              <p className="text-2xl font-semibold text-[#f4f1ea] mt-1">{peakDayName}</p>
              <p className="text-xs text-[#9b9a94] mt-0.5">
                самый активный день ({peakCount} исп.)
              </p>
            </>
          ) : (
            <p className="text-lg text-[#9b9a94] mt-1">{'\u2014'}</p>
          )}
          {allRedemptionsMonth.length > 0 && (
            <div className="flex gap-1 mt-2">
              {DAY_NAMES_RU.map((name, idx) => {
                const count = dayCountMap[idx] || 0
                const maxCount = Math.max(...Object.values(dayCountMap), 1)
                const height = Math.max(4, Math.round((count / maxCount) * 24))
                return (
                  <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                    <div
                      className={`w-full rounded-sm ${idx === peakDay ? 'bg-[#d6b56d]' : 'bg-[#282d34]'}`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-[10px] text-[#9b9a94]">{name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className={`grid grid-cols-1 gap-3 mb-6 ${canManageOffers(access) || canManageStaff(access) ? 'sm:grid-cols-2' : ''} ${canManageOffers(access) && canManageStaff(access) ? 'lg:grid-cols-3' : ''}`}>
        <Link
          href="/business/scanner"
          className="flex items-center gap-3 rounded-xl border border-[#282d34] bg-[#11161c] p-4 text-[#f4f1ea] hover:border-[#d6b56d]/50 transition-colors active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-[#090b0e] text-[#d6b56d] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Сканер</p>
            <p className="text-sm opacity-80">Сканировать QR-коды</p>
          </div>
        </Link>

        {canManageOffers(access) && (
          <Link
            href="/business/offers/create"
            className="flex items-center gap-3 rounded-xl border border-[#282d34] bg-[#11161c] p-4 text-[#f4f1ea] hover:border-[#d6b56d]/50 transition-colors active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-lg bg-[#090b0e] text-[#d6b56d] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Новое предложение</p>
              <p className="text-sm opacity-80">Создать акцию</p>
            </div>
          </Link>
        )}

        {canManageStaff(access) && (
          <Link
            href="/business/staff"
            className="flex items-center gap-3 rounded-xl border border-[#282d34] bg-[#11161c] p-4 text-[#f4f1ea] hover:border-[#d6b56d]/50 transition-colors active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-lg bg-[#090b0e] text-[#d6b56d] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Сотрудники</p>
              <p className="text-sm opacity-80">Управление персоналом</p>
            </div>
          </Link>
        )}
      </div>

      {/* Businesses list */}
      <div className="rounded-xl border border-[#282d34] bg-[#11161c]">
        <div className="flex justify-between items-center px-4 py-4 sm:px-5 border-b border-[#282d34]">
          <h2 className="text-lg font-semibold text-[#f4f1ea]">Мои заведения</h2>
          <Link href="/business/places" className="text-[#d6b56d] hover:opacity-80 text-sm font-medium">
            Все заведения
          </Link>
        </div>

        {businesses.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">У вас пока нет заведений</p>
            <Link
              href="/business/register"
              className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Зарегистрировать первое
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#282d34]">
            {businesses.map((business) => (
              <div key={business.id} className="px-4 py-4 sm:px-5">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#f4f1ea] truncate">{business.name}</h3>
                    <p className="text-sm text-[#9b9a94] mt-0.5">
                      {business._count.places} точек &middot; {business._count.offers} предложений &middot; {business._count.redemptions} использований
                    </p>
                  </div>
                  <Link
                    href="/business/places"
                    className="shrink-0 ml-3 text-[#d6b56d] hover:opacity-80 text-sm font-medium"
                  >
                    Управлять
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
