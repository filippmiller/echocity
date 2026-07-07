'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Loader2, Users, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface ReferralUser {
  id: string
  email: string
  firstName: string
  lastName: string | null
}

interface ReferralItem {
  id: string
  status: string
  createdAt: string
  completedAt: string | null
  referrer: ReferralUser
  invitedUser: ReferralUser
  redemptionCount: number
  eligible: boolean
}

interface ReferralListResponse {
  referrals: ReferralItem[]
  total: number
  limit: number
  offset: number
  status: string
}

const PAGE_SIZE = 20

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'В ожидании',
  COMPLETED: 'Подтверждено',
  EXPIRED: 'Истекло',
  REWARDED: 'Вознаграждено',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  REWARDED: 'bg-green-100 text-green-700',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminReferralsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ReferralListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(0)

  const fetchReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', status)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(page * PAGE_SIZE))

      const res = await fetch(`/api/admin/referrals?${params}`)
      if (!res.ok) throw new Error('Failed to load referrals')
      setData(await res.json())
    } catch {
      toast.error('Не удалось загрузить рефералов')
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchReferrals()
  }, [user, fetchReferrals])

  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const showFrom = total === 0 ? 0 : page * PAGE_SIZE + 1
  const showTo = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Рефералы</h1>
            <p className="text-sm text-gray-500">
              {loading ? '...' : `${total} записей`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm text-gray-500">
            Статус:
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Note */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium">Учёт рефералов</p>
        <p className="mt-1">
          Здесь отображаются рефералы, ожидающие проверки. Статус COMPLETED означает, что приглашённый
          пользователь выполнил первое погашение и реферал стал eligible для вознаграждения, но само
          вознаграждение (rewardGranted) назначается отдельно.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && (!data || data.referrals.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold">Рефералы не найдены</p>
          <p className="text-sm text-gray-500 mt-1">Попробуйте изменить фильтр статуса</p>
        </div>
      )}

      {/* Table */}
      {!loading && data && data.referrals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.8fr] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Реферер</span>
            <span>Приглашённый</span>
            <span>Статус</span>
            <span>Погашения</span>
            <span>Дата</span>
            <span>Eligible</span>
          </div>

          <div className="divide-y divide-gray-100">
            {data.referrals.map((r) => (
              <div
                key={r.id}
                className="px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                {/* Mobile */}
                <div className="lg:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Реферер</span>
                    <UserCell user={r.referrer} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Приглашённый</span>
                    <UserCell user={r.invitedUser} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Статус</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Погашения</span>
                    <span className="text-sm text-gray-700 tabular-nums">{r.redemptionCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Дата</span>
                    <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Eligible</span>
                    <EligibleBadge eligible={r.eligible} />
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden lg:grid lg:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.8fr] gap-4 items-center">
                  <UserCell user={r.referrer} />
                  <UserCell user={r.invitedUser} />
                  <StatusBadge status={r.status} />
                  <span className="text-sm text-gray-700 tabular-nums">{r.redemptionCount}</span>
                  <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                  <EligibleBadge eligible={r.eligible} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            {showFrom}&ndash;{showTo} из {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function UserCell({ user }: { user: ReferralUser }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">
        {user.firstName} {user.lastName || ''}
      </p>
      <p className="text-xs text-gray-500 truncate">{user.email}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function EligibleBadge({ eligible }: { eligible: boolean }) {
  return eligible ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Да
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
      {eligible === false ? (
        <>
          <Clock className="w-3.5 h-3.5" />
          Нет
        </>
      ) : (
        <>
          <AlertCircle className="w-3.5 h-3.5" />
          &mdash;
        </>
      )}
    </span>
  )
}
