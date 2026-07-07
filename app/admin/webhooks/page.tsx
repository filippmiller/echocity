'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Webhook, Loader2, Filter, RefreshCcw } from 'lucide-react'

interface WebhookLog {
  id: string
  provider: string
  eventType: string
  externalId: string | null
  status: string
  error: string | null
  signatureValid: boolean | null
  processedAt: string | null
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700',
  processed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  duplicate: 'bg-gray-100 text-gray-600',
  invalid_signature: 'bg-amber-100 text-amber-700',
}

export default function AdminWebhooksPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)

  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState('')
  const [eventType, setEventType] = useState('')

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (provider.trim()) params.set('provider', provider.trim())
    if (status) params.set('status', status)
    if (eventType.trim()) params.set('eventType', eventType.trim())
    try {
      const res = await fetch(`/api/admin/webhooks?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load webhooks')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch {
      toast.error('Не удалось загрузить вебхуки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') load()
  }, [user])

  const applyFilters = () => load()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
          <Webhook className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Вебхуки</h1>
          <p className="text-sm text-gray-500">
            {loading ? '...' : `${logs.length} записей`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="Провайдер"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Все статусы</option>
          <option value="received">received</option>
          <option value="processed">processed</option>
          <option value="failed">failed</option>
          <option value="duplicate">duplicate</option>
          <option value="invalid_signature">invalid_signature</option>
        </select>
        <input
          type="text"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          placeholder="Тип события"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={applyFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Обновить
        </button>
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
          <Webhook className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold">Нет записей</p>
          <p className="text-sm text-gray-500 mt-1">По выбранным фильтрам вебхуки не найдены</p>
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Провайдер</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Событие</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Статус</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">External ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ошибка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{log.provider}</td>
                    <td className="px-4 py-3 text-gray-700">{log.eventType}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[log.status] || 'bg-gray-100 text-gray-600'}`}>
                        {log.status}
                      </span>
                      {typeof log.signatureValid === 'boolean' && (
                        <span className={`ml-2 text-xs ${log.signatureValid ? 'text-green-600' : 'text-red-600'}`}>
                          {log.signatureValid ? 'sig ok' : 'sig bad'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono truncate max-w-[140px]">
                      {log.externalId || '—'}
                    </td>
                    <td className="px-4 py-3 text-red-600 truncate max-w-[200px]">{log.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
