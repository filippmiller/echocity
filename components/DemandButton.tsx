'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { AuthPrompt } from '@/components/AuthPrompt'

export function DemandButton({ placeId, cityId }: { placeId: string; cityId?: string }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  if (done) {
    return (
      <div className="inline-block px-6 py-2.5 bg-white/20 text-white rounded-xl font-semibold text-sm">
        Запрос отправлен!
      </div>
    )
  }

  const handleClick = async () => {
    if (!user) {
      setShowAuth(true)
      return
    }

    setLoading(true)
    try {
      await fetch('/api/demand/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, cityId: cityId || '' }),
      })
      setDone(true)
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-block px-6 py-2.5 bg-white text-orange-600 rounded-xl font-semibold text-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
      >
        {loading ? 'Отправка...' : 'Хочу скидку здесь!'}
      </button>

      <AuthPrompt
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        reason="Войдите, чтобы запросить скидку в этом заведении"
        redirectTo={`/places/${placeId}`}
      />
    </>
  )
}
