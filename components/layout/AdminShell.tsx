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
  UserPlus,
  ArrowLeft,
  BarChart3,
  Rocket,
  ShieldCheck,
  ScrollText,
  Webhook,
  HeartPulse,
  ClipboardCheck,
  ToggleLeft,
  MessageSquare,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/admin/launch', icon: Rocket, label: 'Launch' },
  { href: '/admin/flags', icon: ToggleLeft, label: 'Флаги' },
  { href: '/admin/moderation', icon: ShieldCheck, label: 'Модерация' },
  { href: '/admin/offers', icon: Tag, label: 'Офферы' },
  { href: '/admin/businesses', icon: Store, label: 'Бизнесы' },
  { href: '/admin/complaints', icon: MessageSquareWarning, label: 'Жалобы' },
  { href: '/admin/reviews/suspicious', icon: MessageSquare, label: 'Отзывы' },
  { href: '/admin/content-quality', icon: ClipboardCheck, label: 'Качество' },
  { href: '/admin/cities', icon: MapPin, label: 'Города' },
  { href: '/admin/franchises', icon: Building2, label: 'Франшизы' },
  { href: '/admin/users', icon: Users, label: 'Пользователи' },
  { href: '/admin/referrals', icon: UserPlus, label: 'Рефералы' },
  { href: '/admin/fraud', icon: ShieldAlert, label: 'Фрод' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Аналитика' },
  { href: '/admin/audit-log', icon: ScrollText, label: 'Аудит' },
  { href: '/admin/webhooks', icon: Webhook, label: 'Вебхуки' },
  { href: '/admin/health', icon: HeartPulse, label: 'Здоровье' },
  { href: '/admin/readiness', icon: ClipboardCheck, label: 'Готовность' },
]

function isActive(href: string, pathname: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#090b0e] text-[#f4f1ea]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#090b0e]/95 border-b border-[#282d34] backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[#9b9a94] hover:text-[#f4f1ea] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />              <span className="hidden sm:inline text-sm">Сайт</span>
            </Link>
            <div className="h-5 w-px bg-[#282d34]" />
            <Link href="/admin" className="text-lg font-semibold tracking-[-0.03em] text-[#f4f1ea]">
              EchoCity
            </Link>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#d6b56d] text-[#090b0e] rounded-md">
              Admin
            </span>
          </div>
        </div>
      </header>

      <div className="flex max-w-screen-2xl mx-auto">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-[#282d34] bg-[#10141a] min-h-[calc(100vh-3.5rem)] sticky top-14">
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
                      ? 'bg-[#090b0e] text-[#d6b56d] border border-[#282d34]'
                      : 'text-[#9b9a94] hover:bg-[#11161c] hover:text-[#f4f1ea]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* ── Main content ── */}        <main className="flex-1 min-w-0 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#090b0e]/95 border-t border-[#282d34] backdrop-blur-xl md:hidden"        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch gap-1 h-14 overflow-x-auto hide-scrollbar px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[72px] h-full px-2 transition-colors ${
                  active ? 'text-[#d6b56d]' : 'text-[#9b9a94] active:text-[#f4f1ea]'
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
