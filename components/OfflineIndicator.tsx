'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { toast } from 'sonner'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Set initial state from browser
    setIsOffline(!navigator.onLine)

    const handleOffline = () => {
      setIsOffline(true)
    }

    const handleOnline = () => {
      setIsOffline(false)
      toast.success('Подключение восстановлено', {
        duration: 3000,
      })
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="w-full bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>Нет подключения — показываем сохранённые данные</span>
    </div>
  )
}
