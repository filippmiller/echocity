'use client'

import { useState, use } from 'react'
import Link from 'next/link'

export default function MiniAppRedeemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRedeem = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/redemptions/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: id }),
      })
      const data = await res.json()
      if (res.ok && data.session?.shortCode) {
        setCode(data.session.shortCode)
      } else {
        setError(data.error || 'Не удалось активировать')
      }
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white z-40 px-4 py-3 border-b flex items-center gap-3">
        <Link href={`/miniapp/offers/${id}`} className="text-blue-500 text-sm">&larr; Назад</Link>
        <h1 className="text-lg font-bold">Активация</h1>
      </header>

      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
        {!code && !error && (
          <button
            onClick={handleRedeem}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Активируем...' : 'Получить код'}
          </button>
        )}

        {code && (
          <div className="text-center">
            <p className="text-gray-500 mb-4">Покажите код кассиру</p>
            <div className="bg-gray-100 rounded-2xl px-8 py-6">
              <p className="text-4xl font-mono font-bold tracking-widest">{code}</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">Код действителен 15 минут</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-blue-500 underline text-sm"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
