'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react'

interface BusinessItem {
  id: string
  name: string
  legalName: string | null
  type: string
  status: string
  description: string | null
  website: string | null
  createdAt: string
  owner: { id: string; email: string; firstName: string; lastName: string | null }
  _count: { places: number; offers: number }
}

interface BusinessDetail {
  id: string
  name: string
  legalName: string | null
  type: string
  status: string
  description: string | null
  website: string | null
  instagram: string | null
  telegram: string | null
  supportEmail: string | null
  supportPhone: string | null
  createdAt: string
  owner: { id: string; email: string; firstName: string; lastName: string | null; phone: string | null }
  places: Array<{ id: string; title: string; address: string; city: string; isActive: boolean }>
  offers: Array<{ id: string; title: string; offerType: string; approvalStatus: string; lifecycleStatus: string }>
  _count: { places: number; offers: number; staff: number; redemptions: number }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'На модерации',
  APPROVED: 'Одобрен',
  REJECTED: 'Отклонен',
  SUSPENDED: 'Приостановлен',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-600',
}

const TYPE_LABELS: Record<string, string> = {
  CAFE: 'Кафе',
  RESTAURANT: 'Ресторан',
  BAR: 'Бар',
  BEAUTY: 'Красота',
  NAILS: 'Ногти',
  HAIR: 'Волосы',
  DRYCLEANING: 'Химчистка',
  OTHER: 'Другое',
}

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const

export default function AdminBusinessesPage() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<BusinessItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('PENDING')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<BusinessDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Reject modal
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadBusinesses = () => {
    setLoading(true)
    const url = filterStatus
      ? `/api/admin/businesses?status=${filterStatus}`
      : '/api/admin/businesses'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setBusinesses(data.businesses || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') loadBusinesses()
  }, [user, filterStatus])

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setDetailData(null)
      return
    }

    setExpandedId(id)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses/${id}`)
      const data = await res.json()
      setDetailData(data.business)
    } catch {
      toast.error('Не удалось загрузить детали')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Бизнес одобрен')
      loadBusinesses()
    } catch {
      toast.error('Не удалось одобрить бизнес')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return
    setActionLoading(rejectId)
    try {
      const res = await fetch(`/api/admin/businesses/${rejectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', reason: rejectReason }),
      })
      if (!res.ok) throw new Error()
      toast.success('Бизнес отклонен')
      setRejectId(null)
      setRejectReason('')
      loadBusinesses()
    } catch {
      toast.error('Не удалось отклонить бизнес')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUSPENDED' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Бизнес приостановлен')
      loadBusinesses()
    } catch {
      toast.error('Не удалось приостановить бизнес')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Модерация бизнесов</h1>
          <p className="text-sm text-gray-500">
            {loading ? '...' : `${businesses.length} бизнесов`}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все статусы</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && businesses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-gray-900 font-semibold">
            {filterStatus === 'PENDING' ? 'Все проверено' : 'Нет бизнесов'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filterStatus === 'PENDING'
              ? 'Нет бизнесов на модерации'
              : 'Нет бизнесов по выбранному фильтру'}
          </p>
        </div>
      )}

      {/* Businesses list */}
      {!loading && businesses.length > 0 && (
        <div className="space-y-2">
          {businesses.map((biz) => {
            const isExpanded = expandedId === biz.id
            const isProcessing = actionLoading === biz.id

            return (
              <div
                key={biz.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
              >
                {/* Summary row */}
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <button
                    onClick={() => handleExpand(biz.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[biz.status] || STATUS_STYLES.PENDING}`}>
                        {STATUS_LABELS[biz.status] || biz.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {TYPE_LABELS[biz.type] || biz.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(biz.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{biz.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {biz.owner.email} | {biz._count.places} мест | {biz._count.offers} офферов
                    </p>
                  </button>

                  {/* Quick actions for PENDING */}
                  {biz.status === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(biz.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span className="hidden sm:inline">Одобрить</span>
                      </button>
                      <button
                        onClick={() => setRejectId(biz.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Отклонить</span>
                      </button>
                    </div>
                  )}

                  {biz.status === 'APPROVED' && (
                    <button
                      onClick={() => handleSuspend(biz.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
                    >
                      Приостановить
                    </button>
                  )}

                  <button onClick={() => handleExpand(biz.id)} className="shrink-0 p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      </div>
                    ) : detailData && detailData.id === biz.id ? (
                      <div className="space-y-4">
                        {/* Owner info */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Владелец</h4>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1">
                            <p>{detailData.owner.firstName} {detailData.owner.lastName || ''}</p>
                            <p className="text-gray-500">{detailData.owner.email}</p>
                            {detailData.owner.phone && <p className="text-gray-500">{detailData.owner.phone}</p>}
                          </div>
                        </div>

                        {/* Business info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">{detailData._count.places}</p>
                            <p className="text-xs text-gray-500">Мест</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">{detailData._count.offers}</p>
                            <p className="text-xs text-gray-500">Офферов</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">{detailData._count.staff}</p>
                            <p className="text-xs text-gray-500">Сотрудников</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-900">{detailData._count.redemptions}</p>
                            <p className="text-xs text-gray-500">Выкупов</p>
                          </div>
                        </div>

                        {/* Contact info */}
                        {(detailData.website || detailData.instagram || detailData.telegram || detailData.supportEmail || detailData.supportPhone) && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Контакты</h4>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              {detailData.website && (
                                <a href={detailData.website} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-blue-50 text-blue-600 rounded hover:underline">
                                  {detailData.website}
                                </a>
                              )}
                              {detailData.instagram && <span className="px-2 py-1 bg-pink-50 text-pink-600 rounded">IG: {detailData.instagram}</span>}
                              {detailData.telegram && <span className="px-2 py-1 bg-sky-50 text-sky-600 rounded">TG: {detailData.telegram}</span>}
                              {detailData.supportEmail && <span className="px-2 py-1 bg-gray-100 rounded">{detailData.supportEmail}</span>}
                              {detailData.supportPhone && <span className="px-2 py-1 bg-gray-100 rounded">{detailData.supportPhone}</span>}
                            </div>
                          </div>
                        )}

                        {/* Places */}
                        {detailData.places.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Места ({detailData.places.length})</h4>
                            <div className="space-y-1">
                              {detailData.places.map((p) => (
                                <div key={p.id} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                                  <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                                  <span className="font-medium">{p.title}</span>
                                  <span className="text-gray-400">{p.address}, {p.city}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Offers */}
                        {detailData.offers.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Офферы ({detailData.offers.length})</h4>
                            <div className="space-y-1">
                              {detailData.offers.map((o) => (
                                <div key={o.id} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                                  <span className="font-medium">{o.title}</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{o.approvalStatus}</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{o.lifecycleStatus}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {detailData.description && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Описание</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{detailData.description}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-4 text-center">Не удалось загрузить детали</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setRejectId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Отклонить бизнес</h3>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Укажите причину отклонения..."
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setRejectId(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === rejectId}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === rejectId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
