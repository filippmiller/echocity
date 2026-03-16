'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Search, LogOut } from 'lucide-react'
import { useState } from 'react'

export function AppHeader() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-gray-900 shrink-0">
          ГдеСейчас
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/offers" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Скидки
          </Link>
          <Link href="/map" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Карта
          </Link>
          <Link href="/search" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Поиск
          </Link>
          <Link href="/favorites" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Избранное
          </Link>
          {user?.role === 'BUSINESS_OWNER' && (
            <Link href="/business/dashboard" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
              Бизнес
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
              Админ
            </Link>
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
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    {user.role === 'CITIZEN' && (
                      <Link href="/settings" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowMenu(false)}>
                        Настройки
                      </Link>
                    )}
                    {user.role === 'BUSINESS_OWNER' && (
                      <Link href="/business/dashboard" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowMenu(false)}>
                        Панель управления
                      </Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowMenu(false)}>
                        Админ-панель
                      </Link>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); handleLogout() }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
