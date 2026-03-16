'use client'

import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'

interface QRRedeemScreenProps {
  offerId: string
}

interface SessionData {
  id: string
  sessionToken: string
  shortCode: string
  expiresAt: string
}

export function QRRedeemScreen({ offerId }: QRRedeemScreenProps) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const createSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/redemptions/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || data.error || 'Ошибка')
        setSession(null)
        return
      }
      setSession(data.session)
      setSecondsLeft(60)

      const url = await QRCode.toDataURL(data.session.sessionToken, { width: 280, margin: 2 })
      setQrDataUrl(url)
    } catch {
      setError('Не удалось создать сессию')
    } finally {
      setLoading(false)
    }
  }, [offerId])

  useEffect(() => {
    createSession()
  }, [createSession])

  // Countdown timer
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [session])

  // Auto-refresh at 30s
  useEffect(() => {
    if (secondsLeft === 30) {
      createSession()
    }
  }, [secondsLeft, createSession])

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button onClick={createSession} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Попробовать снова
        </button>
      </div>
    )
  }

  if (loading && !session) {
    return <div className="text-center py-8 text-gray-500">Создание QR-кода...</div>
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-sm text-gray-500">Покажите QR-код кассиру</p>

      {qrDataUrl && (
        <div className="bg-white p-4 rounded-2xl shadow-lg">
          <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
        </div>
      )}

      {session && (
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">или введите код</p>
          <p className="text-3xl font-mono font-bold tracking-widest text-gray-900">{session.shortCode}</p>
        </div>
      )}

      <div className={`text-sm font-medium ${secondsLeft <= 10 ? 'text-red-500' : 'text-gray-500'}`}>
        {secondsLeft > 0 ? `${secondsLeft}с` : 'Истёк'}
      </div>

      {secondsLeft === 0 && (
        <button onClick={createSession} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
          Обновить QR
        </button>
      )}
    </div>
  )
}
