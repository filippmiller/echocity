'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Search, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { StreakBadge } from '@/components/StreakBadge'

export function AppHeader() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [coinBalance, setCoinBalance] = useState<number>(0)

  // Update streak once per browser session when user is logged in
  useEffect(() => {
    if (!user) return
    const key = 'echocity_streak_pinged'
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/streak', { method: 'POST' }).catch(() => {})
  }, [user])

  // Load coin balance when user is logged in
  useEffect(() => {
    if (!user) return
    fetch('/api/coins')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (d?.balance) setCoinBalance(d.balance) })
      .catch(() => {})
  }, [user])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b ec-line bg-[color:var(--ec-bg)]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="shrink-0 leading-tight">
          <span className="block text-lg font-semibold tracking-[-0.03em] text-[color:var(--ec-text)]">EchoCity</span>
          <span className="block text-[11px] leading-none ec-muted">Санкт-Петербург · рядом</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/offers" className="px-3 py-2 text-sm font-medium ec-muted hover:text-[color:var(--ec-text)] rounded-lg hover:bg-[color:var(--ec-surface)]">
            Скидки
          </Link>
          <Link href="/map" className="px-3 py-2 text-sm font-medium ec-muted hover:text-[color:var(--ec-text)] rounded-lg hover:bg-[color:var(--ec-surface)]">
            Карта
          </Link>
          <Link href="/search" className="px-3 py-2 text-sm font-medium ec-muted hover:text-[color:var(--ec-text)] rounded-lg hover:bg-[color:var(--ec-surface)]">
            Поиск
          </Link>
          <Link href="/favorites" className="px-3 py-2 text-sm font-medium ec-muted hover:text-[color:var(--ec-text)] rounded-lg hover:bg-[color:var(--ec-surface)]">
            Избранное
          </Link>
          <Link href="/demands" className="px-3 py-2 text-sm font-medium ec-accent-text hover:opacity-80 rounded-lg hover:bg-[color:var(--ec-surface)]">
            Запросы
          </Link>
          {user?.role === 'BUSINESS_OWNER' && (
            <Link href="/business/dashboard" className="px-3 py-2 text-sm font-medium ec-muted hover:text-[color:var(--ec-text)] rounded-lg hover:bg-[color:var(--ec-surface)]">
              Бизнес
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="px-3 py-2 text-sm font-medium ec-muted hover:text-[color:var(--ec-text)] rounded-lg hover:bg-[color:var(--ec-surface)]">
              Админ
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search — mobile only */}
          <Link
            href="/search"
            className="md:hidden p-2 ec-muted hover:text-[color:var(--ec-text)] rounded-full hover:bg-[color:var(--ec-surface)]"
          >
            <Search className="w-5 h-5" />
          </Link>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <StreakBadge />
              {coinBalance > 0 && (
                <Link
                  href="/wallet"
                  className="ec-chip flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors chip"
                  title="EchoCoins"
                >
                  🪙 {coinBalance}
                </Link>
              )}
              <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border ec-line"
                  />
                ) : (
                  <div className="ec-chip w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ec-accent-text">
                    {user.email[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="hidden md:inline text-sm font-medium text-[color:var(--ec-text)]">
                  {user.email.split('@')[0]}
                </span>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="ec-surface absolute right-0 mt-2 w-52 rounded-2xl py-1 z-20">
                    {user.role === 'CITIZEN' && (
                      <>
                        <Link href="/wallet" className="block px-4 py-2.5 text-sm text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]" onClick={() => setShowMenu(false)}>
                          🪙 Кошелёк EchoCoins
                        </Link>
                        <Link href="/settings" className="block px-4 py-2.5 text-sm text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]" onClick={() => setShowMenu(false)}>
                          Настройки
                        </Link>
                      </>
                    )}
                    {user.role === 'BUSINESS_OWNER' && (
                      <Link href="/business/dashboard" className="block px-4 py-2.5 text-sm text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]" onClick={() => setShowMenu(false)}>
                        Панель управления
                      </Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="block px-4 py-2.5 text-sm text-[color:var(--ec-text)] hover:bg-[color:var(--ec-surface-muted)]" onClick={() => setShowMenu(false)}>
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
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="hidden md:inline-flex px-3 py-2 text-sm font-medium ec-muted hover:text-[color:var(--ec-text)]">
                Войти
              </Link>
              <Link href="/auth/register" className="ec-accent-bg px-4 py-2 text-sm font-medium rounded-xl transition-opacity hover:opacity-90">
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
