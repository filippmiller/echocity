'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, LogIn, UserPlus } from 'lucide-react'

interface AuthPromptProps {
  isOpen: boolean
  onClose: () => void
  reason: string
  redirectTo?: string
}

export function AuthPrompt({ isOpen, onClose, reason, redirectTo }: AuthPromptProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const loginHref = redirectTo
    ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
    : '/auth/login'

  const registerHref = redirectTo
    ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}`
    : '/auth/register'

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm auth-prompt-backdrop"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl auth-prompt-sheet"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 text-btn"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-2 pb-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-brand-600" />
          </div>

          {/* Reason text */}
          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
            Нужен аккаунт
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6 max-w-xs mx-auto">
            {reason}
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <Link
              href={loginHref}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-600 text-white rounded-xl font-semibold text-base hover:bg-brand-700 transition-colors"
              onClick={onClose}
            >
              <LogIn className="w-5 h-5" />
              Войти
            </Link>

            <Link
              href={registerHref}
              className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              <UserPlus className="w-5 h-5" />
              Зарегистрироваться
            </Link>
          </div>

          {/* Benefit hint */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Регистрация занимает меньше минуты
          </p>
        </div>
      </div>
    </div>
  )
}
