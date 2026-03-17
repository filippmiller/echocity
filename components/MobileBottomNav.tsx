'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import { Home, Tag, MapPin, Heart, User } from 'lucide-react'
import { useState } from 'react'
import { AuthPrompt } from '@/components/AuthPrompt'

interface Tab {
  href: string
  label: string
  icon: typeof Home
  authRequired?: boolean
  authReason?: string
}

const TABS: Tab[] = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/offers', label: 'Скидки', icon: Tag },
  { href: '/map', label: 'Карта', icon: MapPin },
  { href: '/favorites', label: 'Избранное', icon: Heart, authRequired: true, authReason: 'Войдите, чтобы сохранять избранные заведения и скидки' },
  { href: '/profile', label: 'Профиль', icon: User, authRequired: true, authReason: 'Войдите, чтобы видеть свой профиль и историю' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [authPrompt, setAuthPrompt] = useState<{ isOpen: boolean; reason: string; redirectTo?: string }>({
    isOpen: false,
    reason: '',
  })

  // Don't show on business/admin/auth pages
  if (pathname.startsWith('/business') || pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  const getHref = (tab: Tab) => {
    if (tab.href === '/profile') {
      if (!user) return '#'
      if (user.role === 'BUSINESS_OWNER') return '/business/dashboard'
      if (user.role === 'ADMIN') return '/admin'
      return '/profile'
    }
    if (tab.authRequired && !user) return '#'
    return tab.href
  }

  const handleTabClick = (e: React.MouseEvent, tab: Tab) => {
    if (tab.authRequired && !user) {
      e.preventDefault()
      setAuthPrompt({
        isOpen: true,
        reason: tab.authReason || 'Войдите для доступа',
        redirectTo: tab.href,
      })
    }
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-center h-14">
          {TABS.map((tab) => {
            const href = getHref(tab)
            const isActive = tab.href === '/'
              ? pathname === '/'
              : tab.href === '/profile'
                ? pathname.startsWith('/profile') || pathname.startsWith('/settings') || pathname.startsWith('/history')
                : pathname.startsWith(tab.href)
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={href}
                onClick={(e) => handleTabClick(e, tab)}
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

      <AuthPrompt
        isOpen={authPrompt.isOpen}
        onClose={() => setAuthPrompt((s) => ({ ...s, isOpen: false }))}
        reason={authPrompt.reason}
        redirectTo={authPrompt.redirectTo}
      />
    </>
  )
}
