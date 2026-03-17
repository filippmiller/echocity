'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock,
  Heart,
  Settings,
  Crown,
  ChevronRight,
  LogOut,
  Loader2,
  Tag,
  UserPlus,
  PiggyBank,
  Star,
  CalendarDays,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserStats {
  redemptionCount: number
  favoritesCount: number
  memberSince: string | null
  savedTotal: number
  firstName: string
  lastName: string
  email: string
  city: string
  avatarUrl: string | null
  subscription: {
    planCode: string
    planName: string
    status: string
    endAt: string
  } | null
}

interface ReferralData {
  code: string
  stats: {
    totalInvited: number
    completed: number
    rewarded: number
    target: number
  }
}

function formatSavedAmount(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100)
  if (rubles >= 1000) {
    return `${(rubles / 1000).toFixed(1).replace(/\.0$/, '')} K`
  }
  return `${rubles}`
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() || ''
  const last = lastName?.[0]?.toUpperCase() || ''
  return first + last || '?'
}

function getSubscriptionBadge(planCode: string): { label: string; className: string } | null {
  const code = planCode.toLowerCase()
  if (code.includes('premium') || code.includes('pro')) {
    return { label: 'Premium', className: 'bg-amber-100 text-amber-800 border border-amber-200' }
  }
  if (code.includes('plus') || code.includes('basic')) {
    return { label: 'Plus', className: 'bg-brand-100 text-brand-800 border border-brand-200' }
  }
  return { label: planCode, className: 'bg-gray-100 text-gray-700 border border-gray-200' }
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType
  value: string | number
  label: string
}) {
  return (
    <div className="flex-1 bg-white rounded-2xl p-3 text-center shadow-sm">
      <div className="flex justify-center mb-1">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
    </div>
  )
}

function MenuLink({
  href,
  icon: Icon,
  label,
  badge,
  onClick,
  variant = 'default',
}: {
  href?: string
  icon: React.ElementType
  label: string
  badge?: string | null
  onClick?: () => void
  variant?: 'default' | 'danger'
}) {
  const content = (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
        variant === 'danger' ? 'text-red-600' : 'text-gray-900'
      }`}
    >
      <Icon
        className={`w-5 h-5 shrink-0 ${variant === 'danger' ? 'text-red-400' : 'text-gray-400'}`}
      />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    )
  }

  return <Link href={href || '#'}>{content}</Link>
}

export default function ProfilePage() {
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/stats').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/referrals').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([statsData, referralData]) => {
        setStats(statsData)
        setReferral(referralData)
      })
      .catch(() => {
        toast.error('Не удалось загрузить данные профиля')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
    } catch {
      toast.error('Ошибка при выходе')
      setLoggingOut(false)
    }
  }

  const handleCopyReferral = async () => {
    if (!referral?.code) return
    try {
      await navigator.clipboard.writeText(referral.code)
      setCopied(true)
      toast.success('Код скопирован')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-500 text-sm">Не удалось загрузить профиль</p>
        <Link
          href="/auth/login"
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium"
        >
          Войти
        </Link>
      </div>
    )
  }

  const subBadge = stats.subscription ? getSubscriptionBadge(stats.subscription.planCode) : null
  const memberDays = stats.memberSince ? daysSince(stats.memberSince) : 0
  const savedRubles = formatSavedAmount(stats.savedTotal)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with user info */}
      <div className="bg-white pb-6">
        <div className="max-w-2xl mx-auto px-4 pt-8">
          {/* Avatar and name */}
          <div className="flex flex-col items-center text-center">
            {stats.avatarUrl ? (
              <img
                src={stats.avatarUrl}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold shadow-sm">
                {getInitials(stats.firstName, stats.lastName)}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {stats.firstName}
                {stats.lastName ? ` ${stats.lastName}` : ''}
              </h1>
              {subBadge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${subBadge.className}`}
                >
                  {subBadge.label}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-0.5">{stats.email}</p>
            {stats.city && (
              <p className="text-xs text-gray-400 mt-0.5">{stats.city}</p>
            )}
          </div>

          {/* Savings banner */}
          <div className="mt-5 bg-gradient-to-r from-emerald-50 to-brand-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
              <PiggyBank className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Сэкономлено</p>
              <p className="text-xl font-bold text-gray-900">{savedRubles} ₽</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex gap-3">
            <StatCard icon={Tag} value={stats.redemptionCount} label="Скидок" />
            <StatCard icon={Heart} value={stats.favoritesCount} label="Избранных" />
            <StatCard
              icon={CalendarDays}
              value={memberDays}
              label={memberDays === 1 ? 'День' : memberDays < 5 ? 'Дня' : 'Дней'}
            />
          </div>
        </div>
      </div>

      {/* Menu links */}
      <div className="max-w-2xl mx-auto mt-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mx-4">
          <MenuLink
            href="/history"
            icon={Clock}
            label="История скидок"
            badge={stats.redemptionCount > 0 ? `${stats.redemptionCount}` : null}
          />
          <div className="h-px bg-gray-100 ml-12" />
          <MenuLink href="/favorites" icon={Heart} label="Избранное" />
          <div className="h-px bg-gray-100 ml-12" />
          <MenuLink
            href="/subscription"
            icon={Crown}
            label="Подписка"
            badge={stats.subscription ? stats.subscription.planName : null}
          />
        </div>

        {/* Referral section */}
        {referral && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm mx-4 mt-4">
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <UserPlus className="w-5 h-5 text-brand-600" />
                <span className="text-sm font-medium text-gray-900">Пригласить друзей</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Поделитесь кодом с друзьями и получайте бонусы
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-gray-900 tracking-wider text-center border border-gray-200">
                  {referral.code}
                </div>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {referral.stats.totalInvited > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Приглашено: {referral.stats.totalInvited} / Активных: {referral.stats.completed}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mx-4 mt-4">
          <MenuLink href="/settings" icon={Settings} label="Настройки профиля" />
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mx-4 mt-4">
          <MenuLink
            icon={LogOut}
            label={loggingOut ? 'Выход...' : 'Выйти'}
            onClick={handleLogout}
            variant="danger"
          />
        </div>
      </div>
    </div>
  )
}
