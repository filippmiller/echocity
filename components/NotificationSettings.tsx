'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Preferences {
  notificationsEnabled: boolean
  pushNotifications: boolean
  emailNotifications: boolean
}

/**
 * Convert a VAPID public key from URL-safe base64 to a Uint8Array.
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

/**
 * Notification Settings panel.
 *
 * Provides toggle switches for:
 * - Push notifications (master toggle)
 * - Nearby deals
 * - Favorite place alerts
 * - Flash deals
 * - Weekly digest
 *
 * Master toggle controls the actual pushNotifications flag via API.
 * Individual category toggles are stored locally for now (placeholder)
 * and will be wired to backend preference storage in a future iteration.
 */
export function NotificationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({
    notificationsEnabled: true,
    pushNotifications: false,
    emailNotifications: true,
  })

  // Category-level toggles (stored in localStorage for now)
  const [categories, setCategories] = useState({
    nearbyDeals: true,
    favoritePlaces: true,
    flashDeals: true,
    weeklyDigest: true,
  })

  useEffect(() => {
    loadPreferences()
    loadCategoryPrefs()
  }, [])

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (res.ok) {
        const data = await res.json()
        setPreferences(data.preferences)
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryPrefs = () => {
    try {
      const stored = localStorage.getItem('notification_categories')
      if (stored) {
        setCategories(JSON.parse(stored))
      }
    } catch {
      // Use defaults
    }
  }

  const saveCategoryPrefs = (updated: typeof categories) => {
    setCategories(updated)
    localStorage.setItem('notification_categories', JSON.stringify(updated))
  }

  const updatePreference = async (key: keyof Preferences, value: boolean) => {
    setSaving(true)
    const previous = { ...preferences }
    setPreferences((prev) => ({ ...prev, [key]: value }))

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!res.ok) {
        setPreferences(previous)
        toast.error('Не удалось обновить настройки')
        return
      }

      const data = await res.json()
      setPreferences(data.preferences)
    } catch {
      setPreferences(previous)
      toast.error('Ошибка при обновлении настроек')
    } finally {
      setSaving(false)
    }
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      // Need browser permission first
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error('Push-уведомления не поддерживаются в этом браузере')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Уведомления заблокированы в настройках браузера')
        return
      }

      // Register service worker and subscribe
      try {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
          toast.error('Push-уведомления не настроены на сервере')
          return
        }

        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        })

        const subJSON = subscription.toJSON()
        const subRes = await fetch('/api/notifications/subscribe', {
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

        if (!subRes.ok) {
          toast.error('Не удалось подписаться')
          return
        }

        setPreferences((prev) => ({ ...prev, pushNotifications: true }))
        toast.success('Push-уведомления включены')
      } catch {
        toast.error('Ошибка при подписке на push')
      }
    } else {
      // Disable push
      await updatePreference('pushNotifications', false)

      // Also unregister on the browser side
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js')
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            await fetch('/api/notifications/unsubscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint: subscription.endpoint }),
            })
            await subscription.unsubscribe()
          }
        }
      } catch {
        // Best-effort cleanup
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    )
  }

  const pushEnabled = preferences.pushNotifications

  return (
    <div className="space-y-4">
      {/* Master push toggle */}
      <ToggleRow
        label="Push-уведомления"
        description="Получайте уведомления на это устройство"
        checked={pushEnabled}
        onChange={handlePushToggle}
        disabled={saving}
      />

      {/* Category toggles — only active when push is enabled */}
      <div className={pushEnabled ? '' : 'opacity-50 pointer-events-none'}>
        <div className="border-t border-gray-100 pt-3 mt-3 space-y-3">
          <ToggleRow
            label="Скидки рядом"
            description="Уведомления о скидках поблизости"
            checked={categories.nearbyDeals}
            onChange={(v) => saveCategoryPrefs({ ...categories, nearbyDeals: v })}
          />
          <ToggleRow
            label="Избранные места"
            description="Новые предложения от избранных заведений"
            checked={categories.favoritePlaces}
            onChange={(v) => saveCategoryPrefs({ ...categories, favoritePlaces: v })}
          />
          <ToggleRow
            label="Flash-скидки"
            description="Срочные ограниченные предложения"
            checked={categories.flashDeals}
            onChange={(v) => saveCategoryPrefs({ ...categories, flashDeals: v })}
          />
          <ToggleRow
            label="Еженедельный дайджест"
            description="Подборка лучших скидок за неделю"
            checked={categories.weeklyDigest}
            onChange={(v) => saveCategoryPrefs({ ...categories, weeklyDigest: v })}
          />
        </div>
      </div>

      {/* Email notifications toggle */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <ToggleRow
          label="Email-уведомления"
          description="Получать уведомления на почту"
          checked={preferences.emailNotifications}
          onChange={(v) => updatePreference('emailNotifications', v)}
          disabled={saving}
        />
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-brand-600' : 'bg-gray-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
