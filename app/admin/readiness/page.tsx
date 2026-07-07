'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
} from 'lucide-react'

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
  integrations: {
    checklist: EnvCheck[]
    complete: boolean
    missing: string[]
  }
  legal: {
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
  const [smokeLoading, setSmokeLoading] = useState(false)

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

  async function runEmailSmokeTest() {
    setSmokeLoading(true)
    try {
      const res = await fetch('/api/admin/email/smoke', { method: 'POST' })
      const body = await res.json()
      if (res.ok && body.sent) {
        toast.success(body.message || 'Тестовое письмо отправлено')
      } else if (res.ok) {
        toast.warning(body.message || 'Email не настроен')
      } else {
        toast.error(body.message || 'Ошибка при проверке email')
      }
    } catch {
      toast.error('Не удалось выполнить проверку email')
    } finally {
      setSmokeLoading(false)
    }
  }

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

          {/* Integrations */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Интеграции</h2>
              <button
                onClick={runEmailSmokeTest}
                disabled={smokeLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {smokeLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                Проверить email
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {data.integrations?.checklist.map((item) => (
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

          {/* Legal / operator identity */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Юрлицо / контакты</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.legal?.checklist.map((item) => (
                <div key={item.key} className="px-4 py-3 flex items-center justify-between">
                  <code className="text-sm text-gray-700">{item.key}</code>
                  {item.present ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Настроен
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      Отсутствует
                    </span>
                  )}
                </div>
              ))}
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
