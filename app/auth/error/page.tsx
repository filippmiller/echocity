'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'unknown'

  const errorMessages: Record<string, string> = {
    not_configured: 'Интеграция с Яндекс не настроена',
    missing_params: 'Отсутствуют необходимые параметры',
    invalid_state: 'Неверный запрос (возможна попытка атаки)',
    token_exchange_failed: 'Не удалось получить токен доступа',
    profile_fetch_failed: 'Не удалось получить данные профиля',
    internal_error: 'Внутренняя ошибка сервера',
    access_denied: 'Доступ запрещён',
    unknown: 'Неизвестная ошибка',
  }

  const message = errorMessages[reason] || errorMessages.unknown

  return (
    <div className="space-y-6">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ошибка авторизации
        </h1>
        <p className="text-gray-500 mb-8">{message}</p>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="flex items-center justify-center w-full py-3 px-4 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all min-h-[48px]"
          >
            Вернуться к входу
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center w-full py-3 px-4 rounded-xl text-base font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all min-h-[48px]"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500">Загрузка...</p>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
