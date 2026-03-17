'use client'

import { useEffect, useState, useCallback } from 'react'
import { Copy, Share2, Gift, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ReferralData {
  code: string
  stats: {
    totalInvited: number
    completed: number
    rewarded: number
    target: number
  }
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referrals')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const shareUrl = data ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${data.code}` : ''

  const handleCopy = useCallback(async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Ссылка скопирована')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }, [data, shareUrl])

  const handleShare = useCallback(async () => {
    if (!data) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EchoCity — скидки рядом',
          text: `Присоединяйся к EchoCity! Используй мой код: ${data.code}`,
          url: shareUrl,
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopy()
    }
  }, [data, shareUrl, handleCopy])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-brand-600 to-blue-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/2 mb-4" />
        <div className="h-10 bg-white/20 rounded mb-4" />
        <div className="h-4 bg-white/20 rounded w-3/4" />
      </div>
    )
  }

  if (!data) return null

  const { code, stats } = data
  const progress = Math.min(stats.completed / stats.target, 1)
  const rewardUnlocked = stats.completed >= stats.target

  return (
    <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800 rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-blue-200" />
          <h3 className="font-semibold text-lg">Пригласи друзей</h3>
        </div>

        {/* Referral Code */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 mb-0.5">Ваш код</p>
            <p className="text-2xl font-mono font-bold tracking-[0.25em]">{code}</p>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Скопировать"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-300" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-blue-100">
              Пригласили {stats.completed} из {stats.target} друзей
            </span>
            {rewardUnlocked && (
              <span className="text-green-300 font-medium">Награда получена!</span>
            )}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Reward info */}
        <p className="text-sm text-blue-100 mb-4">
          Пригласите {stats.target} друзей — получите месяц Plus бесплатно
        </p>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Поделиться ссылкой
        </button>
      </div>
    </div>
  )
}
