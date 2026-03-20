'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  title: string
  text: string
  url: string
  className?: string
  variant?: 'icon' | 'full'
}

export function ShareButton({
  title,
  text,
  url,
  className = '',
  variant = 'icon',
}: ShareButtonProps) {
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch (err) {
        // User dismissed the share sheet — not an error
        if (err instanceof Error && err.name !== 'AbortError') {
          fallbackCopy()
        }
      }
    } else {
      fallbackCopy()
    }
  }

  const fallbackCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('Ссылка скопирована')
      }).catch(() => {
        toast.error('Не удалось скопировать ссылку')
      })
    }
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-base transition-colors border-2 border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 ${className}`}
      >
        <Share2 className="w-5 h-5" />
        Поделиться
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Поделиться"
      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
    >
      <Share2 className="w-5 h-5 text-gray-400" />
    </button>
  )
}
