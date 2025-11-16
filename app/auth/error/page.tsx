'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') || 'unknown'
  const reason = searchParams.get('reason') || 'unknown'

  const errorMessages: Record<string, string> = {
    not_configured: 'Интеграция с Яндекс не настроена',
    missing_params: 'Отсутствуют необходимые параметры',
    invalid_state: 'Неверный запрос (возможна попытка атаки)',
    token_exchange_failed: 'Не удалось получить токен доступа',
    profile_fetch_failed: 'Не удалось получить данные профиля',
    internal_error: 'Внутренняя ошибка сервера',
    access_denied: 'Доступ запрещен',
    unknown: 'Неизвестная ошибка',
  }

  const message = errorMessages[reason] || errorMessages.unknown

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white py-8 px-6 shadow rounded-lg text-center">
          <div className="mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ошибка авторизации
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Вернуться к входу
            </Link>
            <Link
              href="/"
              className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}

