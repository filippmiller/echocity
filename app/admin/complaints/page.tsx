'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  MessageSquareWarning,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
} from 'lucide-react'

interface ComplaintItem {
  id: string
  userId: string
  placeId: string | null
  offerId: string | null
  type: string
  description: string
  status: string
  priority: string
  adminNote: string | null
  resolvedAt: string | null
  createdAt: string
  user: { id: string; email: string; firstName: string }
}

const TYPE_LABELS: Record<string, string> = {
  OFFER_NOT_HONORED: 'Скидка не применена',
  RUDE_STAFF: 'Грубый персонал',
  FALSE_ADVERTISING: 'Ложная реклама',
  WRONG_DISCOUNT: 'Неверная скидка',
  FRAUD: 'Мошенничество',
  CONTENT_ISSUE: 'Проблема с контентом',
  OTHER: 'Другое',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Открыта',
  IN_REVIEW: 'На рассмотрении',
  RESOLVED: 'Решена',
  DISMISSED: 'Отклонена',
}

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
}

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Срочно',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
}

const STATUS_OPTIONS = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const

export default function AdminComplaintsPage() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')

  const loadComplaints = () => {
    setLoading(true)
    fetch('/api/complaints')
      .then((r) => r.json())
      .then((data) => {
        setComplaints(data.complaints || [])
        // Initialize admin notes
        const notes: Record<string, string> = {}
        for (const c of data.complaints || []) {
          notes[c.id] = c.adminNote || ''
        }
        setAdminNotes(notes)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') loadComplaints()
  }, [user])

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Статус изменен на "${STATUS_LABELS[newStatus]}"`)
      loadComplaints()
    } catch {
      toast.error('Не удалось обновить статус')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveNote = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: adminNotes[id] || '' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Заметка сохранена')
    } catch {
      toast.error('Не удалось сохранить заметку')
    } finally {
      setActionLoading(null)
    }
  }

  // Apply filters
  let filtered = [...complaints]
  if (filterStatus) filtered = filtered.filter((c) => c.status === filterStatus)
  if (filterPriority) filtered = filtered.filter((c) => c.priority === filterPriority)
  if (filterType) filtered = filtered.filter((c) => c.type === filterType)

  // Sort
  if (sortBy === 'priority') {
    const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    filtered.sort((a, b) => (order[a.priority as keyof typeof order] ?? 9) - (order[b.priority as keyof typeof order] ?? 9))
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
          <MessageSquareWarning className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Жалобы</h1>
          <p className="text-sm text-gray-500">
            {loading ? '...' : `${filtered.length} жалоб`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
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

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все приоритеты</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все типы</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="date">По дате</option>
          <option value="priority">По приоритету</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-gray-900 font-semibold">Нет жалоб</p>
          <p className="text-sm text-gray-500 mt-1">
            {complaints.length > 0 ? 'Нет жалоб по выбранным фильтрам' : 'Жалоб пока нет'}
          </p>
        </div>
      )}

      {/* Complaints list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id
            const isProcessing = actionLoading === c.id

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.LOW}`}>
                        {PRIORITY_LABELS[c.priority] || c.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 truncate">{c.user.email}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-700' :
                      c.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {/* Full description */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Описание</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Пользователь: {c.user.firstName} ({c.user.email})</span>
                      {c.placeId && <span>Place: {c.placeId}</span>}
                      {c.offerId && <span>Offer: {c.offerId}</span>}
                    </div>

                    {/* Status actions */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Изменить статус</h4>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(c.id, s)}
                            disabled={isProcessing || c.status === s}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              c.status === s
                                ? 'bg-brand-50 border-brand-300 text-brand-700 cursor-default'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50'
                            }`}
                          >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin inline" /> : STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin note */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Заметка администратора</h4>
                      <textarea
                        value={adminNotes[c.id] || ''}
                        onChange={(e) => setAdminNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="Заметки по жалобе..."
                      />
                      <button
                        onClick={() => handleSaveNote(c.id)}
                        disabled={isProcessing}
                        className="mt-2 px-4 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                      >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Сохранить заметку'}
                      </button>
                    </div>
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
