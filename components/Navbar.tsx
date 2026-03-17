'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-client'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, LogOut, Settings, LayoutDashboard, Shield } from 'lucide-react'
import { CitySelector } from '@/components/CitySelector'

export function Navbar() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  // Hide on auth, admin, and business pages (they have their own shells)
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/business')) return null

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo + City */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ГдеСейчас
          </Link>
          <CitySelector />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/offers" current={pathname}>Скидки</NavLink>
          <NavLink href="/map" current={pathname}>Карта</NavLink>
          <NavLink href="/search" current={pathname}>Поиск</NavLink>
          <NavLink href="/favorites" current={pathname}>Избранное</NavLink>
          {user?.role === 'BUSINESS_OWNER' && (
            <NavLink href="/business/dashboard" current={pathname}>Бизнес</NavLink>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink href="/admin" current={pathname}>Админ</NavLink>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search — mobile only */}
          <Link
            href="/search"
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <Search className="w-5 h-5" />
          </Link>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                    {user.email[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="hidden md:inline text-sm font-medium text-gray-700">
                  {user.email.split('@')[0]}
                </span>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    {user.role === 'CITIZEN' && (
                      <DropdownLink href="/settings" icon={<Settings className="w-4 h-4" />} onClick={() => setShowMenu(false)}>
                        Настройки
                      </DropdownLink>
                    )}
                    {user.role === 'BUSINESS_OWNER' && (
                      <DropdownLink href="/business/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} onClick={() => setShowMenu(false)}>
                        Панель управления
                      </DropdownLink>
                    )}
                    {user.role === 'ADMIN' && (
                      <DropdownLink href="/admin" icon={<Shield className="w-4 h-4" />} onClick={() => setShowMenu(false)}>
                        Админ-панель
                      </DropdownLink>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); handleLogout() }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="hidden md:inline-flex px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Войти
              </Link>
              <Link href="/auth/register" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const isActive = href === '/' ? current === '/' : current.startsWith(href)
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'text-brand-600 bg-brand-50'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}

function DropdownLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={onClick}>
      {icon}
      {children}
    </Link>
  )
}
