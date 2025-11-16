'use client'

import { useState } from 'react'

interface YandexSignInButtonProps {
  redirectTo?: string
  className?: string
}

export default function YandexSignInButton({
  redirectTo,
  className = '',
}: YandexSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleYandexSignIn = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/yandex/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectTo: redirectTo || window.location.pathname }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Yandex OAuth
        window.location.href = data.url
      } else {
        // Handle error - Yandex might not be configured
        console.error('Yandex OAuth not available:', data.error)
        alert('Вход через Яндекс временно недоступен')
        setLoading(false)
      }
    } catch (error) {
      console.error('Yandex sign-in error:', error)
      alert('Ошибка при входе через Яндекс')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleYandexSignIn}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Подключение...</span>
        </>
      ) : (
        <>
          <span className="text-lg">Я</span>
          <span>Войти через Яндекс</span>
        </>
      )}
    </button>
  )
}

