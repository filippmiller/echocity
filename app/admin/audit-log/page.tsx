'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  ScrollText,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'

const ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'APPROVE',
  'REJECT',
  'REQUEST_CHANGES',
  'SUBMIT_FOR_MODERATION',
  'PAUSE',
  'RESUME',
  'DUPLICATE',
  'REDEEM',
  'FLAG_FRAUD',
  'DISMISS_FRAUD',
  'SUSPEND',
  'RESOLVE',
]

interface AuditLog {
  id: string
  actorId: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function AdminAuditLogPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [skip, setSkip] = useState(0)
  const take = 50

  const [actorId, setActorId] = useState('')
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [action, setAction] = useState('')

  const buildUrl = (offset: number) => {
    const params = new URLSearchParams()
    params.set('skip', String(offset))
    params.set('take', String(take))
    if (actorId.trim()) params.set('actorId', actorId.trim())
    if (entityType.trim()) params.set('entityType', entityType.trim())
    if (entityId.trim()) params.set('entityId', entityId.trim())
    if (action) params.set('action', action)
    return `/api/admin/audit-log?${params.toString()}`
  }

  const load = async (offset: number) => {
    setLoading(true)
    try {
      const res = await fetch(buildUrl(offset))
      if (!res.ok) throw new Error('Failed to load audit log')
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setSkip(offset)
    } catch {
      toast.error('Не удалось загрузить журнал аудита')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') load(0)
  }, [user])

  const applyFilters = () => {
    load(0)
  }

  const hasNext = skip + take < total
  const hasPrev = skip > 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Журнал аудита</h1>
          <p className="text-sm text-gray-500">
            {loading ? '...' : `${total} записей`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Фильтры</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              placeholder="Actor ID"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <input
            type="text"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="Entity type"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="Entity ID"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Все действия</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={applyFilters}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Применить
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <ScrollText className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold">Нет записей</p>
          <p className="text-sm text-gray-500 mt-1">По выбранным фильтрам аудит-лог пуст</p>
        </div>
      )}

      {/* Table */}
      {!loading && logs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Время</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Действие</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Тип</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">ID сущности</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Актор</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.entityType}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono truncate max-w-[160px]">
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="text-gray-500 font-mono text-xs">{log.actorId.slice(-8)}</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {skip + 1}–{Math.min(skip + take, total)} из {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => load(skip - take)}
                disabled={!hasPrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
              <button
                onClick={() => load(skip + take)}
                disabled={!hasNext}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
