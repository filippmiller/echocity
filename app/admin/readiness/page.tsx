'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { ClipboardCheck, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface EnvCheck {
  key: string
  present: boolean
}

interface ReadinessData {
  buildSha: string
  lastDeploy: string
  env: {
    checklist: EnvCheck[]
    complete: boolean
    missing: string[]
  }
  migrations: {
    status: 'ok' | 'warning' | 'error'
    message: string
  }
  observability: {
    sentryConfigured: boolean
    healthEndpointConfigured: boolean
  }
}

export default function AdminReadinessPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ReadinessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    fetch('/api/admin/readiness')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load readiness data')
        return r.json()
      })
      .then(setData)
      .catch(() => toast.error('Не удалось загрузить готовность'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Готовность к продакшену</h1>
          <p className="text-sm text-gray-500">Чеклист окружения и инфраструктуры</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <div
            className={`rounded-xl border p-5 flex items-center gap-4 ${
              data.env.complete ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            {data.env.complete ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-600" />
            )}
            <div>
              <p className="text-lg font-bold text-gray-900">
                {data.env.complete ? 'Все обязательные переменные на месте' : 'Не хватает переменных окружения'}
              </p>
              <p className="text-sm text-gray-600">
                Build: {data.buildSha.slice(0, 8)} · Последний деплой:{' '}
                {new Date(data.lastDeploy).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>

          {/* Env checklist */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Переменные окружения</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.env.checklist.map((item) => (
                <div key={item.key} className="px-4 py-3 flex items-center justify-between">
                  <code className="text-sm text-gray-700">{item.key}</code>
                  {item.present ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Настроен
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                      <XCircle className="w-4 h-4" />
                      Отсутствует
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Migrations */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Миграции</h2>
            <div className="flex items-center gap-3">
              {data.migrations.status === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : data.migrations.status === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <p className="text-sm text-gray-700">{data.migrations.message}</p>
            </div>
          </div>

          {/* Observability */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Наблюдаемость</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sentry настроен</span>
                <span className={data.observability.sentryConfigured ? 'text-green-600 font-medium' : 'text-gray-500'}>
                  {data.observability.sentryConfigured ? 'Да' : 'Нет'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Health endpoint</span>
                <span className="text-green-600 font-medium">
                  {data.observability.healthEndpointConfigured ? 'Да' : 'Нет'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
