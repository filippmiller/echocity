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
    <div className="min-h-screen bg-[#090b0e] text-[#f4f1ea]">
      {/* ---- Top header ---- */}
      <header className="sticky top-0 z-40 border-b border-[#282d34] bg-[#090b0e]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-[#9b9a94] hover:text-[#f4f1ea] rounded-lg hover:bg-[#11161c]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/business/dashboard" className="shrink-0 leading-tight">
              <span className="block text-lg font-semibold tracking-[-0.03em] text-[#f4f1ea]">EchoCity Business</span>
              <span className="block text-[11px] leading-none text-[#9b9a94]">операционный день</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden md:flex items-center gap-1 text-sm text-[#9b9a94] hover:text-[#f4f1ea] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              На сайт
            </Link>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-[#282d34] bg-[#11161c] flex items-center justify-center text-[#d6b56d] text-xs font-bold">
                  {user.email[0]?.toUpperCase() || '?'}
                </div>
                <span className="hidden md:inline text-sm font-medium text-[#f4f1ea] max-w-[120px] truncate">
                  {user.email.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex p-2 text-[#9b9a94] hover:text-red-400 rounded-lg hover:bg-[#11161c] transition-colors"
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
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-[#282d34] bg-[#10141a] min-h-[calc(100vh-64px)] sticky top-16 self-start">
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
                      ? 'bg-[#090b0e] text-[#d6b56d] border border-[#282d34]'
                      : 'text-[#9b9a94] hover:text-[#f4f1ea] hover:bg-[#11161c]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-[#282d34]">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#9b9a94] hover:text-[#f4f1ea] rounded-lg hover:bg-[#11161c] transition-colors"
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090b0e]/95 border-t border-[#282d34] backdrop-blur-xl"
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
                    ? 'text-[#d6b56d]'
                    : 'text-[#9b9a94] active:text-[#f4f1ea]'
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
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[#10141a] shadow-xl md:hidden flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b border-[#282d34]">
              <span className="text-lg font-semibold text-[#f4f1ea]">
                EchoCity <span className="text-[#d6b56d] text-sm font-semibold">Business</span>
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-[#9b9a94] hover:text-[#f4f1ea] rounded-lg"
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
                        ? 'bg-[#090b0e] text-[#d6b56d] border border-[#282d34]'
                        : 'text-[#9b9a94] hover:text-[#f4f1ea] hover:bg-[#11161c]'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="p-3 border-t border-[#282d34] space-y-1">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-3 py-3 text-sm text-[#9b9a94] hover:text-[#f4f1ea] rounded-lg hover:bg-[#11161c]"
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
