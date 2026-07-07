'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { HeartPulse, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCcw } from 'lucide-react'

interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  configured?: boolean
  message?: string
}

interface HealthData {
  checkedAt: string
  overall: 'pass' | 'fail'
  uptimeSeconds: number
  buildSha: string
  checks: HealthCheck[]
}

function statusIcon(status: string) {
  if (status === 'pass') return <CheckCircle2 className="w-5 h-5 text-green-600" />
  if (status === 'fail') return <XCircle className="w-5 h-5 text-red-600" />
  return <AlertCircle className="w-5 h-5 text-amber-500" />
}

function statusClass(status: string) {
  if (status === 'pass') return 'bg-green-50 border-green-200'
  if (status === 'fail') return 'bg-red-50 border-red-200'
  return 'bg-amber-50 border-amber-200'
}

export default function AdminHealthPage() {
  const { user } = useAuth()
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/health')
      if (!res.ok) throw new Error('Failed to load health data')
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Не удалось загрузить состояние системы')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') load()
  }, [user])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Здоровье системы</h1>
            <p className="text-sm text-gray-500">
              {data
                ? `Проверено: ${new Date(data.checkedAt).toLocaleString('ru-RU')}`
                : loading
                ? '...'
                : 'Нет данных'}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Обновить
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {data && (
        <>
          <div
            className={`mb-6 rounded-xl border p-5 flex items-center gap-4 ${
              data.overall === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            {data.overall === 'pass' ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <p className="text-lg font-bold text-gray-900">
                {data.overall === 'pass' ? 'Все проверки пройдены' : 'Есть проблемы'}
              </p>
              <p className="text-sm text-gray-600">
                Uptime: {Math.floor(data.uptimeSeconds / 60)} мин · Build: {data.buildSha.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.checks.map((check) => (
              <div
                key={check.name}
                className={`rounded-xl border p-4 flex items-start gap-3 ${statusClass(check.status)}`}
              >
                {statusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{check.name}</p>
                    {typeof check.configured === 'boolean' && (
                      <span className="text-xs text-gray-500">
                        {check.configured ? 'configured' : 'not configured'}
                      </span>
                    )}
                  </div>
                  {check.message && <p className="text-sm text-gray-700 mt-0.5">{check.message}</p>}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium uppercase bg-white border border-gray-200 text-gray-700 shrink-0">
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
