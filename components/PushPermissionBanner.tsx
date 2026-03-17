'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-client'

const DISMISS_KEY = 'push_dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const HAS_REDEEMED_KEY = 'has_redeemed'

/**
 * Registers the service worker and subscribes the browser to push notifications.
 * Returns the PushSubscription on success, or null on failure.
 */
async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return null

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  })

  return subscription
}

/**
 * Convert a VAPID public key from URL-safe base64 to a Uint8Array
 * that the Push API expects.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushPermissionBanner() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    // Only run on client with a logged-in user
    if (!user) return

    // Do not show if push is not supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Do not show if already granted
    if (Notification.permission === 'granted') return

    // Do not show if permission was denied (browser-level block)
    if (Notification.permission === 'denied') return

    // Only show after at least one redemption
    const hasRedeemed = localStorage.getItem(HAS_REDEEMED_KEY)
    if (!hasRedeemed) return

    // Respect the 7-day dismiss cooldown
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      if (elapsed < DISMISS_DURATION_MS) return
    }

    setVisible(true)
  }, [user])

  const handleEnable = async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Уведомления заблокированы в настройках браузера')
        setVisible(false)
        return
      }

      const subscription = await subscribeToPush()
      if (!subscription) {
        toast.error('Не удалось подписаться на уведомления')
        setVisible(false)
        return
      }

      const subJSON = subscription.toJSON()
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJSON.endpoint,
          keys: {
            p256dh: subJSON.keys?.p256dh,
            auth: subJSON.keys?.auth,
          },
        }),
      })

      if (!res.ok) {
        toast.error('Не удалось сохранить подписку')
      } else {
        toast.success('Уведомления включены!')
      }

      setVisible(false)
    } catch {
      toast.error('Ошибка при подписке на уведомления')
    } finally {
      setSubscribing(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <p className="text-sm font-medium flex-1">
          Получайте уведомления о скидках рядом с вами
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnable}
            disabled={subscribing}
            className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {subscribing ? 'Подключение...' : 'Включить'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
