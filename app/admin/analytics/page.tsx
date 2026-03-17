import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import {
  Users,
  Building2,
  MapPin,
  Tag,
  Ticket,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  MessageSquareWarning,
  HelpCircle,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// ── Helpers ──

function formatRubles(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100)
  return rubles.toLocaleString('ru-RU') + ' \u20BD'
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ── Components ──

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-xs text-gray-400 font-medium">&mdash;</span>
  }
  const isPositive = value > 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isPositive ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {isPositive ? '+' : ''}
      {value}%
    </span>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  subtitle,
  borderColor,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle?: string
  borderColor: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className={`bg-white rounded-xl border ${borderColor} p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}

// ── Page ──

export default async function AdminAnalyticsPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  const now = new Date()

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // ── All queries in parallel ──
  const [
    totalUsers,
    activeUsers,
    totalBusinesses,
    approvedBusinesses,
    totalPlaces,
    activePlaces,
    totalOffers,
    activeOffers,
    totalRedemptions,

    // Growth
    newUsersThisWeek,
    newUsersLastWeek,
    newUsersThisMonth,
    newBusinessesThisWeek,
    newBusinessesLastWeek,
    newOffersThisWeek,
    newOffersLastWeek,

    // Redemptions
    redemptionsToday,
    redemptionsThisWeek,
    redemptionsLastWeek,
    redemptionsThisMonth,

    // Revenue
    totalRevenue,
    revenueThisMonth,
    activeSubscribers,
    canceledThisMonth,

    // Demand
    openDemands,
    fulfilledDemands,
    expiredDemands,
    totalDemands,

    // Complaints by status
    complaintsOpen,
    complaintsInReview,
    complaintsResolved,
    complaintsDismissed,

    // Fraud
    fraudOpen,
    fraudReviewed,
    fraudDismissed,
    fraudByHigh,

    // Top offers by redemptions
    topOffers,

    // User registrations last 30 days (daily)
    dailyRegistrations,

    // Total savings
    totalSavings,

    // Resolved complaints for avg resolution time
    resolvedComplaints,
  ] = await Promise.all([
    // Overview
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    prisma.business.count(),
    prisma.business.count({ where: { status: 'APPROVED' } }),
    prisma.place.count(),
    prisma.place.count({ where: { isActive: true } }),
    prisma.offer.count(),
    prisma.offer.count({ where: { lifecycleStatus: 'ACTIVE' } }),
    prisma.redemption.count({ where: { status: 'SUCCESS' } }),

    // Growth
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: lastWeekStart, lt: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.business.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.business.count({ where: { createdAt: { gte: lastWeekStart, lt: weekStart } } }),
    prisma.offer.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.offer.count({ where: { createdAt: { gte: lastWeekStart, lt: weekStart } } }),

    // Redemptions
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: todayStart } } }),
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: weekStart } } }),
    prisma.redemption.count({
      where: { status: 'SUCCESS', redeemedAt: { gte: lastWeekStart, lt: weekStart } },
    }),
    prisma.redemption.count({ where: { status: 'SUCCESS', redeemedAt: { gte: monthStart } } }),

    // Revenue
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', paidAt: { gte: monthStart } },
    }),
    prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.userSubscription.count({
      where: { status: 'CANCELED', canceledAt: { gte: monthStart } },
    }),

    // Demand
    prisma.demandRequest.count({ where: { status: 'OPEN' } }),
    prisma.demandRequest.count({ where: { status: 'FULFILLED' } }),
    prisma.demandRequest.count({ where: { status: 'EXPIRED' } }),
    prisma.demandRequest.count(),

    // Complaints
    prisma.complaint.count({ where: { status: 'OPEN' } }),
    prisma.complaint.count({ where: { status: 'IN_REVIEW' } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { status: 'DISMISSED' } }),

    // Fraud
    prisma.fraudFlag.count({ where: { status: 'OPEN' } }),
    prisma.fraudFlag.count({ where: { status: 'REVIEWED' } }),
    prisma.fraudFlag.count({ where: { status: 'DISMISSED' } }),
    prisma.fraudFlag.count({ where: { status: 'OPEN', severity: 'HIGH' } }),

    // Top offers by redemption count
    prisma.offer.findMany({
      where: { lifecycleStatus: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        branch: { select: { title: true } },
        _count: { select: { redemptions: { where: { status: 'SUCCESS' } } } },
      },
      orderBy: { redemptions: { _count: 'desc' } },
      take: 10,
    }),

    // Daily registrations for the last 30 days
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),

    // Savings
    prisma.userSavings.aggregate({ _sum: { savedAmount: true } }),

    // Resolved complaints
    prisma.complaint.findMany({
      where: { status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 100,
      orderBy: { resolvedAt: 'desc' },
    }),
  ])

  // ── MRR ──
  const activeSubs = await prisma.userSubscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: { select: { monthlyPrice: true } } },
  })
  const mrrKopecks = activeSubs.reduce((sum, s) => sum + s.plan.monthlyPrice, 0)

  // ── Avg resolution hours ──
  let avgResolutionHours = 0
  if (resolvedComplaints.length > 0) {
    const totalMs = resolvedComplaints.reduce((sum, c) => {
      if (!c.resolvedAt) return sum
      return sum + (c.resolvedAt.getTime() - c.createdAt.getTime())
    }, 0)
    avgResolutionHours = Math.round(totalMs / resolvedComplaints.length / (1000 * 60 * 60))
  }

  // ── Daily registration breakdown ──
  const dailyMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, 0)
  }
  for (const u of dailyRegistrations) {
    const key = u.createdAt.toISOString().slice(0, 10)
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1)
  }
  const dailyData = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }))
  const maxDailyReg = Math.max(...dailyData.map((d) => d.count), 1)

  // ── Demand conversion ──
  const demandConversionRate =
    totalDemands > 0 ? Math.round((fulfilledDemands / totalDemands) * 100) : 0
  const collectingDemands = totalDemands - openDemands - fulfilledDemands - expiredDemands

  // ── Complaint totals ──
  const complaintsTotal = complaintsOpen + complaintsInReview + complaintsResolved + complaintsDismissed
  const fraudTotal = fraudOpen + fraudReviewed + fraudDismissed

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Page heading */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Подробная статистика платформы
        </p>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={Users}
          label="Пользователи"
          value={formatNumber(totalUsers)}
          subtitle={`${formatNumber(activeUsers)} активных за 30д`}
          borderColor="border-blue-100"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          icon={Building2}
          label="Бизнесы"
          value={formatNumber(totalBusinesses)}
          subtitle={`${formatNumber(approvedBusinesses)} одобренных`}
          borderColor="border-violet-100"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <SummaryCard
          icon={MapPin}
          label="Заведения"
          value={formatNumber(totalPlaces)}
          subtitle={`${formatNumber(activePlaces)} активных`}
          borderColor="border-emerald-100"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <SummaryCard
          icon={Tag}
          label="Офферы"
          value={formatNumber(totalOffers)}
          subtitle={`${formatNumber(activeOffers)} активных`}
          borderColor="border-amber-100"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ===== USER GROWTH CHART (30 days) ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Регистрации за последние 30 дней
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-end gap-[3px] h-40">
            {dailyData.map((d) => {
              const height = maxDailyReg > 0 ? (d.count / maxDailyReg) * 100 : 0
              const dayLabel = d.date.slice(8, 10) + '.' + d.date.slice(5, 7)
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div
                    className="w-full bg-brand-500 rounded-t-sm min-h-[2px] transition-colors group-hover:bg-brand-600"
                    style={{ height: `${Math.max(height, 1.5)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                    {dayLabel}: {d.count}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>{dailyData[0]?.date.slice(5).replace('-', '.')}</span>
            <span>Всего за период: {formatNumber(newUsersThisMonth)}</span>
            <span>{dailyData[dailyData.length - 1]?.date.slice(5).replace('-', '.')}</span>
          </div>
        </div>
      </div>

      {/* ===== GROWTH WEEK-OVER-WEEK ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Рост (неделя к неделе)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Новые пользователи</span>
              <GrowthBadge value={pct(newUsersThisWeek, newUsersLastWeek)} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(newUsersThisWeek)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              пред. неделя: {formatNumber(newUsersLastWeek)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Новые бизнесы</span>
              <GrowthBadge value={pct(newBusinessesThisWeek, newBusinessesLastWeek)} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(newBusinessesThisWeek)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              пред. неделя: {formatNumber(newBusinessesLastWeek)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Новые офферы</span>
              <GrowthBadge value={pct(newOffersThisWeek, newOffersLastWeek)} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(newOffersThisWeek)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              пред. неделя: {formatNumber(newOffersLastWeek)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Использования</span>
              <GrowthBadge value={pct(redemptionsThisWeek, redemptionsLastWeek)} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(redemptionsThisWeek)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              пред. неделя: {formatNumber(redemptionsLastWeek)}
            </p>
          </div>
        </div>
      </div>

      {/* ===== REVENUE ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Выручка и подписки</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-purple-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Общая выручка
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatRubles(totalRevenue._sum.amount ?? 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-emerald-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                За этот месяц
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatRubles(revenueThisMonth._sum.amount ?? 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                MRR
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatRubles(mrrKopecks)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatNumber(activeSubscribers)} активных подписчиков
            </p>
          </div>

          <div className="bg-white rounded-xl border border-red-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Отмены за месяц
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(canceledThisMonth)}</p>
          </div>
        </div>
      </div>

      {/* ===== TOP OFFERS + REDEMPTIONS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top offers */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Топ офферов по использованиям
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {topOffers.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {topOffers.map((offer, i) => (
                  <div key={offer.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i < 3
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{offer.title}</p>
                      <p className="text-xs text-gray-400 truncate">{offer.branch.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        {formatNumber(offer._count.redemptions)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">Нет данных</div>
            )}
          </div>
        </div>

        {/* Redemption stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Использования офферов</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Сегодня</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(redemptionsToday)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">За неделю</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(redemptionsThisWeek)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">За месяц</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(redemptionsThisMonth)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Всего</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(totalRedemptions)}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-gray-600">Экономия пользователей</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatRubles(totalSavings._sum.savedAmount ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DEMAND + COMPLAINTS + FRAUD ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Demand */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            Запросы спроса
          </h3>
          <div className="space-y-2.5 text-sm">
            <StatRow label="Всего запросов" value={formatNumber(totalDemands)} />
            <StatRow label="Открытых" value={formatNumber(openDemands)} />
            <StatRow label="В сборе" value={formatNumber(collectingDemands)} />
            <StatRow label="Выполнено" value={formatNumber(fulfilledDemands)} />
            <StatRow label="Истекших" value={formatNumber(expiredDemands)} />
            <div className="border-t border-gray-100 pt-2.5">
              <StatRow label="Конверсия" value={`${demandConversionRate}%`} />
            </div>
          </div>
        </div>

        {/* Complaints */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-gray-400" />
            Жалобы
          </h3>
          <div className="space-y-2.5 text-sm">
            <StatRow label="Всего" value={formatNumber(complaintsTotal)} />
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Открытых
              </span>
              <span className="font-semibold text-gray-900">{formatNumber(complaintsOpen)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                На рассмотрении
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(complaintsInReview)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Решено
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(complaintsResolved)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                Отклонено
              </span>
              <span className="font-semibold text-gray-900">
                {formatNumber(complaintsDismissed)}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2.5">
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Среднее время решения
                </span>
                <span className="font-semibold text-gray-900">
                  {avgResolutionHours > 0 ? `${avgResolutionHours} ч` : '\u2014'}
                </span>
              </div>
            </div>
          </div>
          {/* Complaints progress bar */}
          {complaintsTotal > 0 && (
            <div className="mt-4 flex rounded-full overflow-hidden h-2 bg-gray-100">
              <div
                className="bg-red-400"
                style={{ width: `${(complaintsOpen / complaintsTotal) * 100}%` }}
              />
              <div
                className="bg-amber-400"
                style={{ width: `${(complaintsInReview / complaintsTotal) * 100}%` }}
              />
              <div
                className="bg-emerald-400"
                style={{ width: `${(complaintsResolved / complaintsTotal) * 100}%` }}
              />
              <div
                className="bg-gray-300"
                style={{ width: `${(complaintsDismissed / complaintsTotal) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Fraud */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-400" />
            Фрод-мониторинг
          </h3>
          <div className="space-y-2.5 text-sm">
            <StatRow label="Всего алертов" value={formatNumber(fraudTotal)} />
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Открытых
              </span>
              <span className="font-semibold text-gray-900">{formatNumber(fraudOpen)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                Проверено
              </span>
              <span className="font-semibold text-gray-900">{formatNumber(fraudReviewed)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Отклонено
              </span>
              <span className="font-semibold text-gray-900">{formatNumber(fraudDismissed)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Критичных (HIGH)
                </span>
                <span className="font-semibold text-red-600">{formatNumber(fraudByHigh)}</span>
              </div>
            </div>
          </div>
          {/* Fraud progress bar */}
          {fraudTotal > 0 && (
            <div className="mt-4 flex rounded-full overflow-hidden h-2 bg-gray-100">
              <div
                className="bg-red-400"
                style={{ width: `${(fraudOpen / fraudTotal) * 100}%` }}
              />
              <div
                className="bg-amber-400"
                style={{ width: `${(fraudReviewed / fraudTotal) * 100}%` }}
              />
              <div
                className="bg-emerald-400"
                style={{ width: `${(fraudDismissed / fraudTotal) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
