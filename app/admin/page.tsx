'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Tag,
  MapPin,
  Building2,
  ShieldAlert,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react'

interface DashboardStats {
  pendingOffers: number
  activeOffers: number
  totalCities: number
  totalFranchises: number
  totalUsers: number
  fraudAlerts: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load stats from multiple endpoints in parallel
      const [offersRes, citiesRes, franchisesRes] = await Promise.allSettled([
        fetch('/api/admin/offers?status=PENDING').then((r) => r.json()),
        fetch('/api/admin/cities').then((r) => r.json()),
        fetch('/api/admin/franchises').then((r) => r.json()),
      ])

      const pending =
        offersRes.status === 'fulfilled' ? offersRes.value.offers?.length ?? 0 : 0
      const cities =
        citiesRes.status === 'fulfilled' ? citiesRes.value.cities?.length ?? 0 : 0
      const franchises =
        franchisesRes.status === 'fulfilled'
          ? franchisesRes.value.franchises?.length ?? 0
          : 0

      setStats({
        pendingOffers: pending,
        activeOffers: 0,
        totalCities: cities,
        totalFranchises: franchises,
        totalUsers: 0,
        fraudAlerts: 0,
      })
    } catch {
      // Still show the page, just with zeroes
      setStats({
        pendingOffers: 0,
        activeOffers: 0,
        totalCities: 0,
        totalFranchises: 0,
        totalUsers: 0,
        fraudAlerts: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      label: 'На модерации',
      value: stats?.pendingOffers ?? '...',
      icon: Clock,
      href: '/admin/offers',
      color: 'text-deal-urgent',
      bg: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Городов',
      value: stats?.totalCities ?? '...',
      icon: MapPin,
      href: '/admin/cities',
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      borderColor: 'border-brand-200',
    },
    {
      label: 'Франшиз',
      value: stats?.totalFranchises ?? '...',
      icon: Building2,
      href: '/admin/franchises',
      color: 'text-deal-premium',
      bg: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Фрод-алерты',
      value: stats?.fraudAlerts ?? '...',
      icon: ShieldAlert,
      href: '/admin/fraud',
      color: 'text-deal-flash',
      bg: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
  ]

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

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`relative flex flex-col gap-3 p-4 sm:p-5 rounded-xl border bg-white hover:shadow-md transition-shadow ${card.borderColor}`}
            >
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick links */}
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
                <div>
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
