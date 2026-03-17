'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Tag,
  MapPin,
  Building2,
  ShieldAlert,
  MessageSquareWarning,
  Store,
  Users,
  ArrowLeft,
  BarChart3,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/admin/offers', icon: Tag, label: 'Офферы' },
  { href: '/admin/businesses', icon: Store, label: 'Бизнесы' },
  { href: '/admin/complaints', icon: MessageSquareWarning, label: 'Жалобы' },
  { href: '/admin/cities', icon: MapPin, label: 'Города' },
  { href: '/admin/franchises', icon: Building2, label: 'Франшизы' },
  { href: '/admin/users', icon: Users, label: 'Пользователи' },
  { href: '/admin/fraud', icon: ShieldAlert, label: 'Фрод' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Аналитика' },
]

function isActive(href: string, pathname: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Сайт</span>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <Link href="/admin" className="text-lg font-bold text-gray-900">
              ГдеСейчас
            </Link>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-brand-600 text-white rounded-md">
              Admin
            </span>
          </div>
        </div>
      </header>

      <div className="flex max-w-screen-2xl mx-auto">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-3.5rem)] sticky top-14">
          <nav className="flex flex-col gap-1 p-3 pt-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                  active ? 'text-brand-600' : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
