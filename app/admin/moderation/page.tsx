'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquareWarning,
  Store,
  Tag,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit3,
} from 'lucide-react'

interface QueueItem {
  id: string
  type: 'offer' | 'business' | 'complaint'
  title: string
  createdAt: string
  riskScore?: number
  reasons?: string[]
  meta: {
    merchantName?: string
    branchTitle?: string
    city?: string
    createdByName?: string
    createdByEmail?: string
    offerType?: string
    benefitType?: string
    benefitValue?: number
    ownerName?: string
    ownerEmail?: string
    complaintType?: string
    priority?: string
    status?: string
    userEmail?: string
  }
}

const TYPE_LABELS: Record<string, string> = {
  offer: 'Оффер',
  business: 'Бизнес',
  complaint: 'Жалоба',
}

const TYPE_STYLES: Record<string, string> = {
  offer: 'bg-amber-100 text-amber-700',
  business: 'bg-purple-100 text-purple-700',
  complaint: 'bg-red-100 text-red-700',
}

function riskBadgeClass(score: number) {
  if (score >= 70) return 'bg-rose-100 text-rose-700 border-rose-200'
  if (score >= 40) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

export default function AdminModerationPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>(() => {
    const t = searchParams.get('type')
    return t === 'offer' || t === 'business' || t === 'complaint' ? t : ''
  })

  const [modal, setModal] = useState<{
    itemId: string
    itemType: QueueItem['type']
    action: 'reject' | 'requestChanges' | 'resolve'
    title: string
  } | null>(null)
  const [reason, setReason] = useState('')

  const loadQueue = async () => {
    setLoading(true)
    try {
      const url = filterType ? `/api/admin/moderation/queue?type=${filterType}` : '/api/admin/moderation/queue'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load queue')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Не удалось загрузить очередь модерации')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') loadQueue()
  }, [user, filterType])

  const handleAction = async (item: QueueItem, action: string, reasonText?: string) => {
    const key = `${action}:${item.id}`
    setActionLoading(key)
    try {
      const res = await fetch(`/api/admin/moderation/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type, action, reason: reasonText }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Action failed')
      }
      toast.success('Действие выполнено')
      loadQueue()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось выполнить действие')
    } finally {
      setActionLoading(null)
    }
  }

  const openReasonModal = (item: QueueItem, action: 'reject' | 'requestChanges' | 'resolve') => {
    setModal({ itemId: item.id, itemType: item.type, action, title: item.title })
    setReason('')
  }

  const submitReasonModal = async () => {
    if (!modal || !reason.trim()) return
    const item = items.find((i) => i.id === modal.itemId)
    if (!item) return
    await handleAction(item, modal.action, reason.trim())
    setModal(null)
    setReason('')
  }

  const isProcessing = (item: QueueItem, action: string) => actionLoading === `${action}:${item.id}`

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Очередь модерации</h1>
          <p className="text-sm text-gray-500">
            {loading ? '...' : `${items.length} элементов`}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все типы</option>
          <option value="offer">Офферы</option>
          <option value="business">Бизнесы</option>
          <option value="complaint">Жалобы</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle2 className="w-12 h-12 text-green-300 mb-4" />
          <p className="text-gray-900 font-semibold">Очередь пуста</p>
          <p className="text-sm text-gray-500 mt-1">Нет элементов на модерации</p>
        </div>
      )}

      {/* Queue */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.id
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[item.type]}`}>
                        {TYPE_LABELS[item.type]}
                      </span>
                      {typeof item.riskScore === 'number' && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${riskBadgeClass(item.riskScore)}`}>
                          Risk {item.riskScore}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                    {item.type === 'offer' && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.meta.merchantName} — {item.meta.branchTitle}, {item.meta.city}
                      </p>
                    )}
                    {item.type === 'business' && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.meta.ownerEmail}</p>
                    )}
                    {item.type === 'complaint' && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.meta.userEmail}</p>
                    )}
                  </button>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {item.type === 'offer' && (
                      <>
                        <button
                          onClick={() => handleAction(item, 'approve')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isProcessing(item, 'approve') ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Одобрить
                        </button>
                        <button
                          onClick={() => openReasonModal(item, 'reject')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Отклонить
                        </button>
                        <button
                          onClick={() => openReasonModal(item, 'requestChanges')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Доработать
                        </button>
                      </>
                    )}

                    {item.type === 'business' && (
                      <>
                        <button
                          onClick={() => handleAction(item, 'approve')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isProcessing(item, 'approve') ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Одобрить
                        </button>
                        <button
                          onClick={() => openReasonModal(item, 'reject')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Отклонить
                        </button>
                        <button
                          onClick={() => handleAction(item, 'suspend')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Приостановить
                        </button>
                      </>
                    )}

                    {item.type === 'complaint' && (
                      <button
                        onClick={() => openReasonModal(item, 'resolve')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                      >
                        <MessageSquareWarning className="w-3.5 h-3.5" />
                        Решить
                      </button>
                    )}

                    <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    {item.reasons && item.reasons.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Факторы риска
                        </h4>
                        <ul className="space-y-1">
                          {item.reasons.map((r, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.type === 'offer' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Тип</p>
                          <p className="font-medium text-gray-900">{item.meta.offerType}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Выгода</p>
                          <p className="font-medium text-gray-900">
                            {item.meta.benefitType}: {item.meta.benefitValue}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Автор</p>
                          <p className="font-medium text-gray-900">{item.meta.createdByEmail}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Место</p>
                          <p className="font-medium text-gray-900">{item.meta.branchTitle}</p>
                        </div>
                      </div>
                    )}

                    {item.type === 'business' && (
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="text-gray-500">Владелец:</span>{' '}
                          {item.meta.ownerName} ({item.meta.ownerEmail})
                        </p>
                      </div>
                    )}

                    {item.type === 'complaint' && (
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="text-gray-500">Тип:</span> {item.meta.complaintType}
                        </p>
                        <p>
                          <span className="text-gray-500">Приоритет:</span> {item.meta.priority}
                        </p>
                        <p>
                          <span className="text-gray-500">Статус:</span> {item.meta.status}
                        </p>
                        <p>
                          <span className="text-gray-500">Пользователь:</span> {item.meta.userEmail}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reason modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                {modal.action === 'reject' ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : modal.action === 'requestChanges' ? (
                  <Edit3 className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {modal.action === 'reject'
                    ? 'Отклонить'
                    : modal.action === 'requestChanges'
                    ? 'Запросить доработку'
                    : 'Решить жалобу'}
                </h3>
                <p className="text-xs text-gray-500 truncate">{modal.title}</p>
              </div>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Укажите причину..."
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={submitReasonModal}
                disabled={modal.action !== 'resolve' && !reason.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
