'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const VISIT_COUNT_KEY = 'echocity_visit_count'
const DISMISSED_KEY = 'echocity_pwa_dismissed'
const VISIT_THRESHOLD = 3

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Track visit count
    const raw = localStorage.getItem(VISIT_COUNT_KEY)
    const count = raw ? parseInt(raw, 10) + 1 : 1
    localStorage.setItem(VISIT_COUNT_KEY, count.toString())

    // Don't show if dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    // Don't show if already installed (running in standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)

      // Show banner only after threshold visits
      if (count >= VISIT_THRESHOLD) {
        setVisible(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // If the event already fired before our listener (rare), check count
    // and show if we already have a deferred prompt stored
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setVisible(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto bg-brand-600 text-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto">
        <div className="flex-shrink-0 bg-white/20 rounded-xl p-2">
          <Download className="w-5 h-5" />
        </div>
        <p className="flex-1 text-sm font-medium leading-tight">
          Установите ГдеСейчас для быстрого доступа
        </p>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 bg-white text-brand-600 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Установить
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Закрыть"
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
