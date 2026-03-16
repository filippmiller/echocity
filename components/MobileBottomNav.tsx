'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import { Home, Tag, MapPin, Heart, User } from 'lucide-react'

const TABS = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/offers', label: 'Скидки', icon: Tag },
  { href: '/map', label: 'Карта', icon: MapPin },
  { href: '/favorites', label: 'Избранное', icon: Heart },
  { href: '/profile', label: 'Профиль', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't show on business/admin/auth pages
  if (pathname.startsWith('/business') || pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  const getHref = (tab: typeof TABS[0]) => {
    if (tab.href === '/profile') {
      if (!user) return '/auth/login'
      if (user.role === 'BUSINESS_OWNER') return '/business/dashboard'
      if (user.role === 'ADMIN') return '/admin'
      return '/settings'
    }
    return tab.href
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-14">
        {TABS.map((tab) => {
          const href = getHref(tab)
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive
                  ? 'text-brand-600'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
