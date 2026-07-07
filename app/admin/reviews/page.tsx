'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  MessageSquareWarning,
  Loader2,
  AlertCircle,
  User,
  FileX,
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

interface VelocityUser {
  userId: string
  reviewCount: number
  windowHours: number
}

interface SuspiciousSignals {
  rejectedPlaceReviews: { count: number; items: SuspiciousSignal[] }
  rejectedOfferReviews: { count: number; items: SuspiciousSignal[] }
  highVelocityUsers: { count: number; items: VelocityUser[] }
  auditRejections: { count: number; items: SuspiciousSignal[] }
  webhookReviewFailures: { count: number; items: SuspiciousSignal[] }
  checkedAt: string
}

const SECTIONS: Array<{
  key: keyof SuspiciousSignals
  title: string
  description: string
  icon: typeof FileX
  emptyText: string
}> = [
  {
    key: 'rejectedPlaceReviews',
    title: 'Отклонённые отзывы о местах',
    description: 'Сняты с публикации или удалены',
    icon: FileX,
    emptyText: 'Нет отклонённых отзывов о местах',
  },
  {
    key: 'rejectedOfferReviews',
    title: 'Отклонённые отзывы об офферах',
    description: 'Сняты с публикации',
    icon: FileX,
    emptyText: 'Нет отклонённых отзывов об офферах',
  },
  {
    key: 'highVelocityUsers',
    title: 'Пользователи с высокой активностью',
    description: 'Много отзывов за короткий срок',
    icon: User,
    emptyText: 'Нет пользователей с подозрительной активностью',
  },
  {
    key: 'auditRejections',
    title: 'Отклонения через аудит',
    description: 'REJECT для REVIEW / OFFER_REVIEW',
    icon: ScrollText,
    emptyText: 'Нет аудит-отклонений отзывов',
  },
  {
    key: 'webhookReviewFailures',
    title: 'Ошибки вебхуков отзывов',
    description: 'Failed / invalid signature',
    icon: Webhook,
    emptyText: 'Нет ошибок вебхуков отзывов',
  },
]

function formatMetaPreview(meta?: Record<string, unknown>): string {
  if (!meta) return ''
  const parts: string[] = []
  if (typeof meta.rating === 'number') parts.push(`оценка ${meta.rating}`)
  if (typeof meta.bodyPreview === 'string') parts.push(meta.bodyPreview)
  if (typeof meta.commentPreview === 'string') parts.push(meta.commentPreview)
  if (typeof meta.provider === 'string') parts.push(meta.provider)
  if (typeof meta.eventType === 'string') parts.push(meta.eventType)
  return parts.join(' · ')
}

export default function AdminReviewsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<SuspiciousSignals | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews/suspicious')
      if (!res.ok) throw new Error('Failed to load suspicious review signals')
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Не удалось загрузить сигналы антифрода отзывов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') load()
  }, [user])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
          <MessageSquareWarning className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Антифрод отзывов</h1>
          <p className="text-sm text-gray-500">
            {loading
              ? '...'
              : data
              ? `Проверено ${new Date(data.checkedAt).toLocaleString('ru-RU')}`
              : 'Нет данных'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold">Не удалось загрузить сигналы</p>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {SECTIONS.map((section) => {
            const sectionData = data[section.key] as { count: number; items: unknown[] }
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
                        sectionData.count > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {sectionData.count}
                    </span>
                  </div>
                </div>

                {sectionData.count === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">{section.emptyText}</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <tbody className="divide-y divide-gray-50">
                        {sectionData.items.map((item, idx) => {
                          const signal = item as SuspiciousSignal | VelocityUser
                          const isVelocity = 'reviewCount' in signal
                          return (
                            <tr key={`${(signal as SuspiciousSignal).id || idx}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                {'userId' in signal && !isVelocity && (
                                  <p className="text-xs text-gray-500 mb-0.5">
                                    Пользователь: {(signal as SuspiciousSignal).userId?.slice(-8)}
                                  </p>
                                )}
                                {isVelocity && (
                                  <p className="font-medium text-gray-900">
                                    Пользователь: {(signal as VelocityUser).userId.slice(-8)} ·{' '}
                                    {(signal as VelocityUser).reviewCount} отзывов за{' '}
                                    {(signal as VelocityUser).windowHours} ч
                                  </p>
                                )}
                                {!isVelocity && (
                                  <>
                                    <p className="font-medium text-gray-900">
                                      {(signal as SuspiciousSignal).reason}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {formatMetaPreview((signal as SuspiciousSignal).meta)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {new Date(
                                        (signal as SuspiciousSignal).createdAt
                                      ).toLocaleString('ru-RU')}
                                    </p>
                                  </>
                                )}
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
