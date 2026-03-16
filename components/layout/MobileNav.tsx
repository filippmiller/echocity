'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Tag, MapPin, Heart, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Главная' },
  { href: '/offers', icon: Tag, label: 'Скидки' },
  { href: '/map', icon: MapPin, label: 'Карта' },
  { href: '/favorites', icon: Heart, label: 'Избранное' },
  { href: '/profile', icon: User, label: 'Профиль' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
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
  )
}
