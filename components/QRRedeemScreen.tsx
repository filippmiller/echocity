'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { CheckCircle2, RefreshCw, Coins } from 'lucide-react'
import { toast } from 'sonner'
import { hapticSuccess } from '@/lib/haptics'

interface QRRedeemScreenProps {
  offerId: string
  offerTitle?: string
}

interface SessionData {
  id: string
  sessionToken: string
  shortCode: string
  expiresAt: string
}

function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
    )
  })
}

export function QRRedeemScreen({ offerId, offerTitle }: QRRedeemScreenProps) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [geoStatus, setGeoStatus] = useState<'pending' | 'granted' | 'denied'>('pending')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const createSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Request geolocation for proximity verification
      const location = await getUserLocation()
      setGeoStatus(location ? 'granted' : 'denied')

      const res = await fetch('/api/redemptions/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId,
          ...(location ? { lat: location.lat, lng: location.lng } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || data.error || 'Ошибка')
        setSession(null)
        return
      }
      setSession(data.session)
      setSecondsLeft(60)

      const url = await QRCode.toDataURL(data.session.sessionToken, {
        width: 280,
        margin: 2,
        color: { dark: '#1D4ED8', light: '#FFFFFF' },
      })
      setQrDataUrl(url)
    } catch {
      setError('Не удалось создать сессию')
    } finally {
      setLoading(false)
    }
  }, [offerId])

  // Poll session status to detect redemption and show cashback toast
  const startPolling = useCallback((sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/redemptions/session-status?sessionId=${sessionId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'USED') {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
          hapticSuccess()
          setRedeemed(true)
          if (data.earnedCoins > 0) {
            setEarnedCoins(data.earnedCoins)
            toast.success(`+${data.earnedCoins} EchoCoins заработано! 🪙`, {
              description: 'Монеты добавлены в ваш кошелёк',
              duration: 5000,
            })
          }
        }
      } catch { /* ignore */ }
    }, 2000)
  }, [])

  useEffect(() => {
    createSession()
  }, [createSession])

  // Start polling whenever we have a new session
  useEffect(() => {
    if (!session) return
    startPolling(session.id)
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [session, startPolling])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    if (secondsLeft === 30) createSession()
  }, [secondsLeft, createSession])

  const progress = secondsLeft / 60

  if (redeemed) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle2 className="w-24 h-24 text-deal-savings" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-900 mt-4"
        >
          Использовано!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 mt-2"
        >
          {offerTitle || 'Скидка активирована'}
        </motion.p>
        {earnedCoins > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100"
          >
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">
              +{earnedCoins} EchoCoins заработано!
            </span>
          </motion.div>
        )}
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="ec-panel p-4">
        <div className="text-sm text-red-600 mb-4">{error}</div>
        <button
          onClick={createSession}
          className="ec-button inline-flex items-center gap-2 px-4 py-2 text-sm transition-opacity hover:opacity-90"
        >
          <RefreshCw className="w-4 h-4" />
          Попробовать снова
        </button>
      </div>
    )
  }

  if (loading && !session) {
    return (
      <div className="ec-panel flex items-center gap-3 p-4">
        <div className="w-5 h-5 border-2 border-[color:var(--ec-accent)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm ec-muted">Создание QR-кода...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 border-b ec-line pb-3">
        <div>
          <p className="text-xs ec-muted">предложение</p>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--ec-text)]">
            {offerTitle || 'Скидка активирована на кассе'}
          </h2>
        </div>
        <span className="shrink-0 rounded-full border ec-line px-2.5 py-1 text-xs font-semibold text-[color:var(--ec-accent-2)]">
          активно
        </span>
      </div>

      <div className="grid grid-cols-[164px_1fr] gap-3 border-b ec-line pb-3">
        <div className="ec-panel grid h-[164px] w-[164px] place-items-center rounded-[18px] shadow-none">
          <AnimatePresence mode="wait">
            {qrDataUrl && (
              <motion.img
                key={session?.id}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                src={qrDataUrl}
                alt="QR Code"
                className="h-[132px] w-[132px] rounded-lg"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0">
          <div className={`text-4xl font-bold tracking-[-0.06em] ${secondsLeft <= 10 ? 'text-deal-discount' : 'ec-accent-text'}`}>
            {secondsLeft > 0 ? `00:${secondsLeft.toString().padStart(2, '0')}` : '00:00'}
          </div>
          <p className="mt-0.5 text-xs ec-muted">до обновления QR</p>
          {session && (
            <>
              <p className="mt-3 font-mono text-xl font-bold tracking-[0.18em] text-[color:var(--ec-text)]">
                {session.shortCode}
              </p>
              <p className="text-xs ec-muted">код для ручного ввода</p>
            </>
          )}
          <button
            onClick={createSession}
            className="ec-button-secondary mt-3 inline-flex h-9 w-full items-center justify-center gap-2 px-3 text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            обновить QR
          </button>
        </div>
      </div>

      <div className="h-1 rounded-full bg-[color:var(--ec-line)]">
        <div
          className="h-full rounded-full bg-[color:var(--ec-accent)] transition-all duration-1000"
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        />
      </div>

      {geoStatus === 'denied' && (
        <p className="text-xs text-[color:var(--ec-warning)]">
          Геолокация не предоставлена. Для подтверждения скидки рядом с заведением разрешите доступ к местоположению.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="ec-panel p-2 shadow-none">
          <b className="text-sm">QR</b>
          <span className="block text-[11px] ec-muted">сканер</span>
        </div>
        <div className="ec-panel p-2 shadow-none">
          <b className="text-sm">код</b>
          <span className="block text-[11px] ec-muted">fallback</span>
        </div>
        <div className="ec-panel p-2 shadow-none">
          <b className="text-sm">60 сек</b>
          <span className="block text-[11px] ec-muted">TTL</span>
        </div>
      </div>
    </div>
  )
}
