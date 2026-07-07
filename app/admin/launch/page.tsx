'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Rocket,
  Loader2,
  Store,
  Tag,
  MessageSquareWarning,
  CreditCard,
  Webhook,
  HeartPulse,
  ArrowUpRight,
} from 'lucide-react'

interface LaunchCounts {
  newBusinesses24h: number
  newBusinesses7d: number
  pendingOffers: number
  pendingBusinesses: number
  openComplaints: number
  failedPayments24h: number
  webhookFailures24h: number
  lowHealthChecks: number
}

interface LaunchCard {
  label: string
  value: number
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  subtitle?: string
}

export default function AdminLaunchPage() {
  const { user } = useAuth()
  const [counts, setCounts] = useState<LaunchCounts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    fetch('/api/admin/launch')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load launch data')
        return r.json()
      })
      .then((data) => setCounts(data.counts))
      .catch(() => toast.error('Не удалось загрузить сводку запуска'))
      .finally(() => setLoading(false))
  }, [user])

  const cards: LaunchCard[] = counts
    ? [
        {
          label: 'Новые бизнесы (24ч)',
          value: counts.newBusinesses24h,
          href: '/admin/businesses',
          icon: Store,
          color: 'text-purple-600 bg-purple-50',
          subtitle: `7 дней: ${counts.newBusinesses7d}`,
        },
        {
          label: 'Бизнесы на модерации',
          value: counts.pendingBusinesses,
          href: '/admin/moderation?type=business',
          icon: Store,
          color: 'text-amber-600 bg-amber-50',
        },
        {
          label: 'Офферы на модерации',
          value: counts.pendingOffers,
          href: '/admin/moderation?type=offer',
          icon: Tag,
          color: 'text-blue-600 bg-blue-50',
        },
        {
          label: 'Открытые жалобы',
          value: counts.openComplaints,
          href: '/admin/complaints',
          icon: MessageSquareWarning,
          color: 'text-red-600 bg-red-50',
        },
        {
          label: 'Неудачные платежи (24ч)',
          value: counts.failedPayments24h,
          href: '/admin/webhooks',
          icon: CreditCard,
          color: 'text-rose-600 bg-rose-50',
        },
        {
          label: 'Ошибки вебхуков (24ч)',
          value: counts.webhookFailures24h,
          href: '/admin/webhooks',
          icon: Webhook,
          color: 'text-orange-600 bg-orange-50',
        },
        {
          label: 'Low health checks',
          value: counts.lowHealthChecks,
          href: '/admin/health',
          icon: HeartPulse,
          color: 'text-emerald-600 bg-emerald-50',
        },
      ]
    : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Launch Ops</h1>
          <p className="text-sm text-gray-500">Операционная сводка запуска</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value.toLocaleString('ru-RU')}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {!loading && counts && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/webhooks"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-200 hover:shadow-sm transition-all"
          >
            <Webhook className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Мониторинг вебхуков</span>
          </Link>
          <Link
            href="/admin/health"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-200 hover:shadow-sm transition-all"
          >
            <HeartPulse className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">Проверки здоровья</span>
          </Link>
        </div>
      )}
    </div>
  )
}
