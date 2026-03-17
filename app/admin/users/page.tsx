'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  Users,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  AlertTriangle,
} from 'lucide-react'

/* ───── Types ───── */

interface UserSubscription {
  status: string
  planName: string
}

interface UserItem {
  id: string
  email: string
  firstName: string
  lastName: string | null
  role: string
  phone: string | null
  city: string
  isActive: boolean
  createdAt: string
  redemptionCount: number
  complaintsCount: number
  demandCount: number
  subscription: UserSubscription | null
}

interface UserDetail {
  id: string
  email: string
  firstName: string
  lastName: string | null
  role: string
  phone: string | null
  city: string
  language: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  profile: {
    avatarUrl: string | null
    homeCity: string | null
    marketingOptIn: boolean
    notificationsEnabled: boolean
  } | null
  subscriptions: Array<{
    id: string
    status: string
    startAt: string
    endAt: string
    autoRenew: boolean
    plan: { name: string; code: string; monthlyPrice: number }
  }>
  redemptions: Array<{
    id: string
    status: string
    redeemedAt: string
    discountAmount: string | null
    offer: { id: string; title: string }
    branch: { id: string; title: string }
  }>
  complaints: Array<{
    id: string
    type: string
    status: string
    description: string
    createdAt: string
  }>
  demandRequests: Array<{
    id: string
    placeName: string | null
    status: string
    supportCount: number
    createdAt: string
  }>
  _count: {
    redemptions: number
    complaints: number
    demandRequests: number
  }
}

/* ───── Constants ───── */

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Админ',
  CITIZEN: 'Гражданин',
  BUSINESS_OWNER: 'Владелец бизнеса',
  MERCHANT_STAFF: 'Сотрудник',
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  CITIZEN: 'bg-blue-100 text-blue-700',
  BUSINESS_OWNER: 'bg-green-100 text-green-700',
  MERCHANT_STAFF: 'bg-amber-100 text-amber-700',
}

const SUB_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRIALING: 'bg-blue-100 text-blue-700',
  PAST_DUE: 'bg-orange-100 text-orange-700',
  CANCELED: 'bg-gray-100 text-gray-500',
  EXPIRED: 'bg-gray-100 text-gray-400',
}

const SUB_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активна',
  TRIALING: 'Пробная',
  PAST_DUE: 'Просрочена',
  CANCELED: 'Отменена',
  EXPIRED: 'Истекла',
}

const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  OFFER_NOT_HONORED: 'Скидка не применена',
  RUDE_STAFF: 'Грубый персонал',
  FALSE_ADVERTISING: 'Ложная реклама',
  WRONG_DISCOUNT: 'Неверная скидка',
  FRAUD: 'Мошенничество',
  CONTENT_ISSUE: 'Контент',
  OTHER: 'Другое',
}

const PAGE_SIZE = 20

/* ───── Helpers ───── */

function initials(first: string, last?: string | null): string {
  const f = first?.[0]?.toUpperCase() || ''
  const l = last?.[0]?.toUpperCase() || ''
  return f + l || '?'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ───── Component ───── */

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()

  // Data
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(0)

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<UserDetail | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    userId: string
    action: string
    message: string
  } | null>(null)

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 350)
  }, [])

  // Fetch users list
  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(page * PAGE_SIZE))
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (roleFilter) params.set('role', roleFilter)
    if (activeFilter) params.set('isActive', activeFilter)
    params.set('sortBy', 'createdAt')
    params.set('sortDir', 'desc')

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Не удалось загрузить пользователей')
        setLoading(false)
      })
  }, [page, debouncedSearch, roleFilter, activeFilter])

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') fetchUsers()
  }, [currentUser, fetchUsers])

  // Fetch expanded user detail
  const handleExpand = useCallback(
    (id: string) => {
      if (expandedId === id) {
        setExpandedId(null)
        setExpandedUser(null)
        return
      }
      setExpandedId(id)
      setExpandedUser(null)
      setExpandedLoading(true)

      fetch(`/api/admin/users/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setExpandedUser(data.user || null)
          setExpandedLoading(false)
        })
        .catch(() => {
          toast.error('Не удалось загрузить детали')
          setExpandedLoading(false)
        })
    },
    [expandedId],
  )

  // Toggle active/blocked
  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    if (currentlyActive) {
      // Blocking requires confirmation
      setConfirmDialog({
        userId,
        action: 'block',
        message: 'Заблокировать этого пользователя? Он потеряет доступ к платформе.',
      })
      return
    }
    await performToggleActive(userId, true)
  }

  const performToggleActive = async (userId: string, newActive: boolean) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Ошибка')
        return
      }
      toast.success(newActive ? 'Пользователь разблокирован' : 'Пользователь заблокирован')
      fetchUsers()
      if (expandedId === userId) {
        setExpandedUser(null)
        setExpandedId(null)
      }
    } catch {
      toast.error('Не удалось обновить пользователя')
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  // Change role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Ошибка')
        return
      }
      toast.success(`Роль изменена на "${ROLE_LABELS[newRole]}"`)
      fetchUsers()
      if (expandedId === userId) {
        setExpandedUser(null)
        setExpandedId(null)
      }
    } catch {
      toast.error('Не удалось изменить роль')
    } finally {
      setActionLoading(null)
    }
  }

  // Pagination info
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const showFrom = total === 0 ? 0 : page * PAGE_SIZE + 1
  const showTo = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Users className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-sm text-gray-500">
            {loading ? '...' : `${total} пользователей`}
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Поиск по email, имени..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(0)
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все роли</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as '' | 'true' | 'false')
            setPage(0)
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все статусы</option>
          <option value="true">Активные</option>
          <option value="false">Заблокированные</option>
        </select>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold">Пользователи не найдены</p>
          <p className="text-sm text-gray-500 mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && users.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden lg:grid lg:grid-cols-[2.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.5fr] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Пользователь</span>
            <span>Роль</span>
            <span>Статус</span>
            <span>Подписка</span>
            <span className="text-right">Погашения</span>
            <span>Регистрация</span>
            <span />
          </div>

          <div className="divide-y divide-gray-100">
            {users.map((u) => {
              const isExpanded = expandedId === u.id
              const isProcessing = actionLoading === u.id
              const isSelf = currentUser?.userId === u.id

              return (
                <div key={u.id}>
                  {/* ── Row ── */}
                  <button
                    onClick={() => handleExpand(u.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Mobile layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                            u.isActive
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-50 text-red-400'
                          }`}
                        >
                          {initials(u.firstName, u.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {u.firstName} {u.lastName || ''}
                            </span>
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_STYLES[u.role] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden lg:grid lg:grid-cols-[2.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.5fr] gap-4 items-center">
                      {/* User */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                            u.isActive
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-50 text-red-400'
                          }`}
                        >
                          {initials(u.firstName, u.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {u.firstName} {u.lastName || ''}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Role */}
                      <span
                        className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[u.role] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {ROLE_LABELS[u.role] || u.role}
                      </span>

                      {/* Status */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="text-sm text-gray-700">
                          {u.isActive ? 'Активен' : 'Заблокирован'}
                        </span>
                      </div>

                      {/* Subscription */}
                      <div>
                        {u.subscription ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SUB_STATUS_STYLES[u.subscription.status] || 'bg-gray-100 text-gray-500'}`}
                          >
                            {u.subscription.planName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">&mdash;</span>
                        )}
                      </div>

                      {/* Redemptions */}
                      <span className="text-sm text-gray-700 text-right tabular-nums">
                        {u.redemptionCount}
                      </span>

                      {/* Joined */}
                      <span className="text-xs text-gray-500">{formatDate(u.createdAt)}</span>

                      {/* Expand icon */}
                      <div className="flex justify-end">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* ── Expanded detail ── */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-gray-50/30">
                      {expandedLoading && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        </div>
                      )}

                      {expandedUser && !expandedLoading && (
                        <div className="space-y-5">
                          {/* ── Actions row ── */}
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Toggle active */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActive(u.id, u.isActive)
                              }}
                              disabled={isProcessing || isSelf}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                                u.isActive
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : u.isActive ? (
                                <ShieldOff className="w-3.5 h-3.5" />
                              ) : (
                                <Shield className="w-3.5 h-3.5" />
                              )}
                              {u.isActive ? 'Заблокировать' : 'Разблокировать'}
                            </button>

                            {/* Role change */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Роль:</span>
                              <select
                                value={u.role}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleRoleChange(u.id, e.target.value)
                                }}
                                disabled={isProcessing || isSelf}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                              >
                                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {isSelf && (
                              <span className="text-xs text-gray-400 italic">
                                Нельзя изменить свой аккаунт
                              </span>
                            )}
                          </div>

                          {/* ── Profile info ── */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <InfoItem label="Телефон" value={expandedUser.phone || '---'} />
                            <InfoItem label="Город" value={expandedUser.city} />
                            <InfoItem label="Язык" value={expandedUser.language === 'ru' ? 'Русский' : 'English'} />
                            <InfoItem label="Обновлен" value={formatDate(expandedUser.updatedAt)} />
                          </div>

                          {/* ── Stats row ── */}
                          <div className="grid grid-cols-3 gap-3">
                            <StatCard label="Погашения" value={expandedUser._count.redemptions} />
                            <StatCard label="Жалобы" value={expandedUser._count.complaints} />
                            <StatCard label="Запросы" value={expandedUser._count.demandRequests} />
                          </div>

                          {/* ── Subscriptions ── */}
                          {expandedUser.subscriptions.length > 0 && (
                            <DetailSection title="Подписки">
                              <div className="space-y-1.5">
                                {expandedUser.subscriptions.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SUB_STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-500'}`}
                                      >
                                        {SUB_STATUS_LABELS[sub.status] || sub.status}
                                      </span>
                                      <span className="text-gray-700">{sub.plan.name}</span>
                                    </div>
                                    <span className="text-gray-400">
                                      {formatDate(sub.startAt)} &mdash; {formatDate(sub.endAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </DetailSection>
                          )}

                          {/* ── Recent redemptions ── */}
                          {expandedUser.redemptions.length > 0 && (
                            <DetailSection title="Последние погашения">
                              <div className="space-y-1.5">
                                {expandedUser.redemptions.map((r) => (
                                  <div
                                    key={r.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="text-gray-700 truncate block">
                                        {r.offer.title}
                                      </span>
                                      <span className="text-gray-400">{r.branch.title}</span>
                                    </div>
                                    <span className="text-gray-400 shrink-0 ml-3">
                                      {formatDateTime(r.redeemedAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </DetailSection>
                          )}

                          {/* ── Complaints ── */}
                          {expandedUser.complaints.length > 0 && (
                            <DetailSection title="Жалобы">
                              <div className="space-y-1.5">
                                {expandedUser.complaints.map((c) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-gray-500">
                                        {COMPLAINT_TYPE_LABELS[c.type] || c.type}
                                      </span>
                                      <span className="text-gray-400 truncate">
                                        {c.description.slice(0, 60)}
                                        {c.description.length > 60 ? '...' : ''}
                                      </span>
                                    </div>
                                    <span className="text-gray-400 shrink-0 ml-3">
                                      {formatDate(c.createdAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </DetailSection>
                          )}

                          {/* ── Demand requests ── */}
                          {expandedUser.demandRequests.length > 0 && (
                            <DetailSection title="Запросы на скидки">
                              <div className="space-y-1.5">
                                {expandedUser.demandRequests.map((d) => (
                                  <div
                                    key={d.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-700">
                                        {d.placeName || 'Без места'}
                                      </span>
                                      <span className="text-gray-400">
                                        {d.supportCount} голосов
                                      </span>
                                    </div>
                                    <span className="text-gray-400">
                                      {formatDate(d.createdAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </DetailSection>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
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

      {/* ── Confirmation dialog ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Подтвердите действие</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => performToggleActive(confirmDialog.userId, false)}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Заблокировать'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───── Sub-components ───── */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm text-gray-700 mt-0.5">{value}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 text-center">
      <p className="text-lg font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h4>
      {children}
    </div>
  )
}
