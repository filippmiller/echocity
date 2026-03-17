'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import {
  LayoutDashboard,
  Tag,
  ScanLine,
  Users,
  MapPin,
  History,
  ArrowLeft,
  LogOut,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  BarChart3,
  Film,
  CalendarCheck,
  TableProperties,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/business/dashboard', icon: LayoutDashboard, label: 'Панель' },
  { href: '/business/offers', icon: Tag, label: 'Акции' },
  { href: '/business/scanner', icon: ScanLine, label: 'Сканер' },
  { href: '/business/demand', icon: MessageSquare, label: 'Запросы' },
  { href: '/business/analytics', icon: BarChart3, label: 'Аналитика' },
]

const SIDEBAR_ITEMS = [
  { href: '/business/dashboard', icon: LayoutDashboard, label: 'Панель управления' },
  { href: '/business/offers', icon: Tag, label: 'Предложения' },
  { href: '/business/places', icon: MapPin, label: 'Заведения' },
  { href: '/business/scanner', icon: ScanLine, label: 'Сканер QR' },
  { href: '/business/staff', icon: Users, label: 'Сотрудники' },
  { href: '/business/redemptions', icon: History, label: 'История' },
  { href: '/business/demand', icon: MessageSquare, label: 'Запросы' },
  { href: '/business/analytics', icon: BarChart3, label: 'Аналитика' },
  { href: '/business/stories', icon: Film, label: 'Истории' },
  { href: '/business/reservations-manage', icon: CalendarCheck, label: 'Бронирования' },
  { href: '/business/tables', icon: TableProperties, label: 'Столы' },
]

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* ---- Top header ---- */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/business/dashboard" className="text-lg font-bold text-gray-900 shrink-0">
              ГдеСейчас
              <span className="text-brand-600 ml-1 text-sm font-semibold">Бизнес</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              На сайт
            </Link>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                  {user.email[0]?.toUpperCase() || '?'}
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.email.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* ---- Desktop sidebar ---- */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-100 bg-white min-h-[calc(100vh-56px)] sticky top-14 self-start">
          <nav className="flex-1 py-4 px-3 space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = item.href === '/business/dashboard'
                ? pathname === '/business/dashboard'
                : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться на сайт
            </Link>
          </div>
        </aside>

        {/* ---- Main content ---- */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* ---- Mobile bottom nav ---- */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/business/dashboard'
              ? pathname === '/business/dashboard'
              : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                  isActive
                    ? 'text-brand-600'
                    : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ---- Mobile slide-out sidebar ---- */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl md:hidden flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
              <span className="text-lg font-bold text-gray-900">
                ГдеСейчас <span className="text-brand-600 text-sm font-semibold">Бизнес</span>
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = item.href === '/business/dashboard'
                  ? pathname === '/business/dashboard'
                  : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="p-3 border-t border-gray-100 space-y-1">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Вернуться на сайт
              </Link>
              {user && (
                <button
                  onClick={() => { setSidebarOpen(false); handleLogout() }}
                  className="flex items-center gap-2 w-full px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
