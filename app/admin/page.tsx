'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Tag,
  MapPin,
  Building2,
  ShieldAlert,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Ticket,
  ArrowUpRight,
  Clock,
  Wallet,
  Heart,
  MessageSquareWarning,
  HelpCircle,
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalBusinesses: number
    approvedBusinesses: number
    totalPlaces: number
    activeOffers: number
    totalRedemptions: number
  }
  growth: {
    usersThisWeek: number
    usersLastWeek: number
    usersThisMonth: number
    usersGrowthPct: number
    businessesThisWeek: number
    businessesLastWeek: number
    businessesThisMonth: number
    businessesGrowthPct: number
    offersThisWeek: number
    offersLastWeek: number
    offersThisMonth: number
    offersGrowthPct: number
    redemptionsThisWeek: number
    redemptionsLastWeek: number
    redemptionsGrowthPct: number
  }
  engagement: {
    redemptionsToday: number
    redemptionsThisWeek: number
    redemptionsThisMonth: number
    uniqueRedeemersWeek: number
    avgRedemptionsPerUser: number
    totalSavingsKopecks: number
  }
  revenue: {
    totalRevenueKopecks: number
    revenueThisMonthKopecks: number
    activeSubscribers: number
    mrrKopecks: number
    canceledThisMonth: number
  }
  demand: {
    openDemands: number
    fulfilledDemands: number
    totalDemands: number
    conversionRate: number
  }
  quality: {
    openComplaints: number
    openFraudFlags: number
    avgResolutionHours: number
  }
  recentRedemptions: {
    id: string
    userName: string
    offerTitle: string
    placeName: string
    redeemedAt: string
  }[]
}

function formatRubles(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100)
  return rubles.toLocaleString('ru-RU') + ' \u20BD'
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function GrowthBadge({ pct }: { pct: number }) {
  if (pct === 0) {
    return <span className="text-xs text-gray-400 font-medium">&mdash;</span>
  }
  const isPositive = pct > 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isPositive ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {isPositive ? '+' : ''}
      {pct}%
    </span>
  )
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 ${className}`}>
      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-3" />
      <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  return `${days} дн назад`
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load analytics')
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Не удалось загрузить аналитику</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const quickLinks = [
    {
      label: 'Модерация офферов',
      description: 'Одобрение и отклонение новых предложений',
      href: '/admin/offers',
      icon: Tag,
    },
    {
      label: 'Управление городами',
      description: 'Добавление и настройка городов',
      href: '/admin/cities',
      icon: MapPin,
    },
    {
      label: 'Франшизы',
      description: 'Управление франшизами и партнерами',
      href: '/admin/franchises',
      icon: Building2,
    },
    {
      label: 'Фрод-мониторинг',
      description: 'Контроль подозрительной активности',
      href: '/admin/fraud',
      icon: ShieldAlert,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="mt-1 text-sm text-gray-500">Обзор платформы</p>
      </div>

      {/* ===== HERO STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : data ? (
          <>
            <div className="bg-white rounded-xl border border-blue-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Пользователи
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(data.overview.totalUsers)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatNumber(data.overview.activeUsers)} активных за 30д
              </p>
            </div>

            <div className="bg-white rounded-xl border border-purple-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Подписчики
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(data.revenue.activeSubscribers)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                MRR: {formatRubles(data.revenue.mrrKopecks)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-emerald-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Использований сегодня
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(data.engagement.redemptionsToday)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatNumber(data.engagement.redemptionsThisWeek)} за неделю
              </p>
            </div>

            <div className="bg-white rounded-xl border border-amber-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Выручка за месяц
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatRubles(data.revenue.revenueThisMonthKopecks)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Всего: {formatRubles(data.revenue.totalRevenueKopecks)}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* ===== GROWTH SECTION ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Рост (неделя к неделе)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : data ? (
            <>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Новые пользователи</span>
                  <GrowthBadge pct={data.growth.usersGrowthPct} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.growth.usersThisWeek)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  пред. неделя: {formatNumber(data.growth.usersLastWeek)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Новые бизнесы</span>
                  <GrowthBadge pct={data.growth.businessesGrowthPct} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.growth.businessesThisWeek)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  пред. неделя: {formatNumber(data.growth.businessesLastWeek)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Использования</span>
                  <GrowthBadge pct={data.growth.redemptionsGrowthPct} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.growth.redemptionsThisWeek)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  пред. неделя: {formatNumber(data.growth.redemptionsLastWeek)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Новые офферы</span>
                  <GrowthBadge pct={data.growth.offersGrowthPct} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.growth.offersThisWeek)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  пред. неделя: {formatNumber(data.growth.offersLastWeek)}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ===== ENGAGEMENT SECTION ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Вовлеченность</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : data ? (
            <>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-gray-500">Уник. клиентов за неделю</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.engagement.uniqueRedeemersWeek)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-gray-500">Среднее исп. / пользователь</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.engagement.avgRedemptionsPerUser}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">за текущий месяц</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-gray-500">Экономия пользователей</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRubles(data.engagement.totalSavingsKopecks)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">всего распределено</p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ===== DEMAND + QUALITY ROW ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Demand */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            Спрос
          </h3>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : data ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Открытых запросов</span>
                <span className="font-semibold text-gray-900">{data.demand.openDemands}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Выполнено</span>
                <span className="font-semibold text-gray-900">{data.demand.fulfilledDemands}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Конверсия</span>
                <span className="font-semibold text-gray-900">{data.demand.conversionRate}%</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quality */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-gray-400" />
            Качество
          </h3>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : data ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Открытых жалоб</span>
                <span className="font-semibold text-gray-900">{data.quality.openComplaints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Фрод-алерты</span>
                <span className="font-semibold text-gray-900">{data.quality.openFraudFlags}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Среднее время решения</span>
                <span className="font-semibold text-gray-900">
                  {data.quality.avgResolutionHours > 0
                    ? `${data.quality.avgResolutionHours} ч`
                    : '\u2014'}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ===== QUICK ACCESS ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрый доступ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-200 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* ===== RECENT ACTIVITY ===== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние использования</h2>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : data && data.recentRedemptions.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recentRedemptions.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{r.userName}</span>
                      <span className="text-gray-400 mx-1.5">&middot;</span>
                      <span>{r.offerTitle}</span>
                    </p>
                    <p className="text-xs text-gray-400 truncate">{r.placeName}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {timeAgo(r.redeemedAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">Нет данных</div>
          )}
        </div>
      </div>
    </div>
  )
}
