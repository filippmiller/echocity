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
  const circumference = 2 * Math.PI * 130
  const strokeDashoffset = circumference * (1 - progress)

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
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={createSession}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Попробовать снова
        </button>
      </div>
    )
  }

  if (loading && !session) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 mt-3">Создание QR-кода...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-sm text-gray-500 font-medium">Покажите QR-код кассиру</p>

      {/* QR with progress ring */}
      <div className="relative">
        <svg className="w-72 h-72" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="130" fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <circle
            cx="140" cy="140" r="130"
            fill="none"
            stroke={secondsLeft <= 10 ? '#EF4444' : '#2563EB'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 140 140)"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        <AnimatePresence mode="wait">
          {qrDataUrl && (
            <motion.div
              key={session?.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <img src={qrDataUrl} alt="QR Code" className="w-52 h-52 rounded-xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {session && (
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">или введите код</p>
          <p className="text-3xl font-mono font-bold tracking-widest text-gray-900">
            {session.shortCode}
          </p>
        </div>
      )}

      <div className={`text-sm font-semibold ${secondsLeft <= 10 ? 'text-deal-discount' : 'text-gray-500'}`}>
        {secondsLeft > 0 ? `${secondsLeft}с` : 'Истёк'}
      </div>

      {geoStatus === 'denied' && (
        <p className="text-xs text-amber-600 text-center max-w-[260px]">
          Геолокация не предоставлена. Для подтверждения скидки рядом с заведением разрешите доступ к местоположению.
        </p>
      )}

      {secondsLeft === 0 && (
        <button
          onClick={createSession}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить QR
        </button>
      )}
    </div>
  )
}
