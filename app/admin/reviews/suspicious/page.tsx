'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  ShieldAlert,
  Loader2,
  AlertCircle,
  MessageSquare,
  MessageSquareWarning,
  User,
  ScrollText,
  Webhook,
} from 'lucide-react'

interface SuspiciousSignal {
  id: string
  userId?: string
  placeId?: string
  offerId?: string
  entityType?: string
  entityId?: string
  reason: string
  createdAt: string
  meta?: Record<string, unknown>
}

interface ReviewVelocityUser {
  userId: string
  reviewCount: number
  windowHours: number
}

interface SuspiciousSignals {
  rejectedPlaceReviews: { count: number; items: SuspiciousSignal[] }
  rejectedOfferReviews: { count: number; items: SuspiciousSignal[] }
  highVelocityUsers: { count: number; items: ReviewVelocityUser[] }
  auditRejections: { count: number; items: SuspiciousSignal[] }
  webhookReviewFailures: { count: number; items: SuspiciousSignal[] }
  checkedAt: string
}

const SECTIONS: Array<{
  key: keyof SuspiciousSignals
  title: string
  description: string
  icon: typeof MessageSquare
  itemReason: (item: SuspiciousSignal | ReviewVelocityUser) => string
  itemMeta?: (item: SuspiciousSignal | ReviewVelocityUser) => string | null
}> = [
  {
    key: 'rejectedPlaceReviews',
    title: 'Отклонённые отзывы о местах',
    description: 'Сняты с публикации или удалены',
    icon: MessageSquare,
    itemReason: (item) => (item as SuspiciousSignal).reason,
    itemMeta: (item) => {
      const s = item as SuspiciousSignal
      return s.userId ? `user ${s.userId.slice(0, 8)}` : null
    },
  },
  {
    key: 'rejectedOfferReviews',
    title: 'Отклонённые отзывы на офферы',
    description: 'Сняты с публикации',
    icon: MessageSquareWarning,
    itemReason: (item) => (item as SuspiciousSignal).reason,
    itemMeta: (item) => {
      const s = item as SuspiciousSignal
      return s.offerId ? `offer ${s.offerId.slice(0, 8)}` : null
    },
  },
  {
    key: 'highVelocityUsers',
    title: 'Пользователи с подозрительной активностью',
    description: 'Много отзывов за короткое окно',
    icon: User,
    itemReason: (item) => `${(item as ReviewVelocityUser).reviewCount} отзывов за ${(item as ReviewVelocityUser).windowHours}ч`,
    itemMeta: (item) => `user ${(item as ReviewVelocityUser).userId.slice(0, 8)}`,
  },
  {
    key: 'auditRejections',
    title: 'Отклонения из аудит-лога',
    description: 'REJECT действия над REVIEW / OFFER_REVIEW',
    icon: ScrollText,
    itemReason: (item) => (item as SuspiciousSignal).reason,
    itemMeta: (item) => {
      const s = item as SuspiciousSignal
      return [s.entityType, s.entityId?.slice(0, 8)].filter(Boolean).join(' · ')
    },
  },
  {
    key: 'webhookReviewFailures',
    title: 'Ошибки вебхуков (review)',
    description: 'Неудачные или невалидные webhook события',
    icon: Webhook,
    itemReason: (item) => (item as SuspiciousSignal).reason,
    itemMeta: (item) => {
      const s = item as SuspiciousSignal
      const meta = s.meta as { provider?: string; eventType?: string } | undefined
      return [meta?.provider, meta?.eventType].filter(Boolean).join(' · ') || null
    },
  },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminReviewSuspiciousPage() {
  const { user } = useAuth()
  const [signals, setSignals] = useState<SuspiciousSignals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    setLoading(true)
    fetch('/api/admin/reviews/suspicious')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load suspicious review signals')
        return r.json()
      })
      .then(setSignals)
      .catch(() => toast.error('Не удалось загрузить сигналы отзывов'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Подозрительные отзывы</h1>
          <p className="text-sm text-gray-500">
            {loading
              ? '...'
              : signals
              ? `Проверено ${new Date(signals.checkedAt).toLocaleString('ru-RU')}`
              : 'Нет данных'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {!loading && !signals && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold">Не удалось загрузить отчёт</p>
        </div>
      )}

      {!loading && signals && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
            const data = signals[section.key] as { count: number; items: Array<SuspiciousSignal | ReviewVelocityUser> }
            const Icon = section.icon
            return (
              <div
                key={section.key}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                        data.count > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {data.count}
                    </span>
                  </div>
                </div>

                {data.count === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Нет сигналов</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <tbody className="divide-y divide-gray-50">
                        {data.items.map((item) => {
                          const id = (item as SuspiciousSignal).id || (item as ReviewVelocityUser).userId
                          const createdAt = (item as SuspiciousSignal).createdAt
                          return (
                            <tr key={id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">{section.itemReason(item)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {section.itemMeta?.(item)}
                                  {createdAt && (
                                    <span className="ml-2 text-gray-400">{formatDate(createdAt)}</span>
                                  )}
                                </p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
