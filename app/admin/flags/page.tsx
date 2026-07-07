'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Loader2, ToggleLeft, ToggleRight, Shield, Save } from 'lucide-react'
import type { FeatureFlagKey } from '@/lib/feature-flags'

interface FlagRow {
  key: FeatureFlagKey
  enabled: boolean
  description: string
  allowedRoles: string[]
}

export default function AdminFlagsPage() {
  const { user } = useAuth()
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [newDescription, setNewDescription] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    loadFlags()
  }, [user])

  const loadFlags = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/flags')
      if (!res.ok) throw new Error('Failed to load flags')
      const data = await res.json()
      setFlags(data.flags ?? [])
    } catch {
      toast.error('Не удалось загрузить флаги')
    } finally {
      setLoading(false)
    }
  }

  const toggleFlag = async (flag: FlagRow) => {
    setSaving((prev) => new Set(prev).add(flag.key))
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flag.key, enabled: !flag.enabled }),
      })
      if (!res.ok) throw new Error('Failed to toggle flag')
      const data = await res.json()
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? data.flag : f)))
      toast.success(`Флаг ${flag.key} ${data.flag.enabled ? 'включён' : 'выключен'}`)
    } catch {
      toast.error('Не удалось изменить флаг')
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(flag.key)
        return next
      })
    }
  }

  const updateDescription = async (flag: FlagRow) => {
    const description = newDescription[flag.key]
    if (description === undefined) return

    setSaving((prev) => new Set(prev).add(flag.key))
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flag.key, description }),
      })
      if (!res.ok) throw new Error('Failed to update flag')
      const data = await res.json()
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? data.flag : f)))
      setNewDescription((prev) => {
        const next = { ...prev }
        delete next[flag.key]
        return next
      })
      toast.success('Описание обновлено')
    } catch {
      toast.error('Не удалось обновить описание')
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(flag.key)
        return next
      })
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <ToggleLeft className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-sm text-gray-500">Управление рискованными фичами и экспериментами</p>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium">Приоритет значений:</p>
        <ol className="list-decimal ml-5 mt-1 space-y-0.5">
          <li>Переменная окружения <code>{'{'}FEATURE_FLAG_&lt;KEY&gt;{'}'}</code></li>
          <li>Значение из базы данных (ниже)</li>
          <li>Консервативный дефолт <code>false</code> — выключено</li>
        </ol>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="mt-6 space-y-3">
          {flags.map((flag) => {
            const isSaving = saving.has(flag.key)
            const hasDescriptionEdit = newDescription[flag.key] !== undefined

            return (
              <div
                key={flag.key}
                className={`bg-white rounded-xl border p-4 transition-colors ${
                  flag.enabled ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-semibold text-gray-900">{flag.key}</code>
                      {flag.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <ToggleRight className="w-3 h-3" />
                          Вкл
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <ToggleLeft className="w-3 h-3" />
                          Выкл
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-start gap-2">
                      <input
                        type="text"
                        defaultValue={flag.description}
                        placeholder="Описание флага..."
                        className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        onChange={(e) =>
                          setNewDescription((prev) => ({ ...prev, [flag.key]: e.target.value }))
                        }
                      />
                      {hasDescriptionEdit && (
                        <button
                          onClick={() => updateDescription(flag)}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Сохранить
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Роли: {flag.allowedRoles.length > 0 ? flag.allowedRoles.join(', ') : 'все'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFlag(flag)}
                    disabled={isSaving}
                    className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      flag.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : flag.enabled ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                    {flag.enabled ? 'Выключить' : 'Включить'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && flags.length === 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Нет зарегистрированных флагов. Они появятся при первом обращении.
        </div>
      )}
    </div>
  )
}
