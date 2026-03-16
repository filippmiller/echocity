'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Plus, X, Loader2 } from 'lucide-react'

interface Franchise {
  id: string
  code: string
  name: string
  status: string
  billingEmail?: string
  billingPlan?: string
  revenueSharePercent?: number
  ownerUser: {
    id: string
    email: string
  }
  _count: {
    cities: number
    members: number
  }
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-deal-savings',
  SUSPENDED: 'bg-amber-50 text-deal-urgent',
  EXPIRED: 'bg-red-50 text-deal-discount',
  DRAFT: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активна',
  SUSPENDED: 'Приостановлена',
  EXPIRED: 'Истекла',
  DRAFT: 'Черновик',
}

export default function AdminFranchisesPage() {
  const router = useRouter()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    ownerUserEmail: '',
    status: 'ACTIVE',
    billingEmail: '',
    billingPlan: '',
    revenueSharePercent: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadFranchises()
  }, [])

  const loadFranchises = async () => {
    try {
      const res = await fetch('/api/admin/franchises')
      if (res.status === 403) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      setFranchises(data.franchises || [])
    } catch {
      toast.error('Ошибка при загрузке франшиз')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        code: formData.code,
        name: formData.name,
        ownerUserEmail: formData.ownerUserEmail,
        status: formData.status,
      }

      if (formData.billingEmail) payload.billingEmail = formData.billingEmail
      if (formData.billingPlan) payload.billingPlan = formData.billingPlan
      if (formData.revenueSharePercent)
        payload.revenueSharePercent = parseInt(formData.revenueSharePercent)

      const res = await fetch('/api/admin/franchises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Ошибка при создании франшизы')
        return
      }

      toast.success(`Франшиза "${formData.name}" создана`)
      setFormData({
        code: '',
        name: '',
        ownerUserEmail: '',
        status: 'ACTIVE',
        billingEmail: '',
        billingPlan: '',
        revenueSharePercent: '',
      })
      setShowForm(false)
      loadFranchises()
    } catch {
      toast.error('Ошибка при создании франшизы')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-deal-premium" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Франшизы</h1>
            <p className="text-sm text-gray-500">
              {loading ? '...' : `${franchises.length} франшиз`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showForm
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Отмена
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Создать франшизу
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Новая франшиза</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Код *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  required
                  pattern="[A-Z0-9\-_]+"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="MSK-PRIME"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email владельца *
                </label>
                <input
                  type="email"
                  value={formData.ownerUserEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerUserEmail: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                >
                  <option value="DRAFT">Черновик</option>
                  <option value="ACTIVE">Активна</option>
                  <option value="SUSPENDED">Приостановлена</option>
                  <option value="EXPIRED">Истекла</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email для биллинга
                </label>
                <input
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, billingEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  План биллинга
                </label>
                <input
                  type="text"
                  value={formData.billingPlan}
                  onChange={(e) =>
                    setFormData({ ...formData, billingPlan: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Доля дохода (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.revenueSharePercent}
                  onChange={(e) =>
                    setFormData({ ...formData, revenueSharePercent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Создание...' : 'Создать франшизу'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-surface-tertiary">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Код
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Владелец
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Городов
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Участников
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {franchises.map((franchise) => (
                  <tr key={franchise.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-semibold">
                        {franchise.code}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {franchise.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[franchise.status] || STATUS_STYLES.DRAFT
                        }`}
                      >
                        {STATUS_LABELS[franchise.status] || franchise.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap hidden md:table-cell">
                      {franchise.ownerUser.email}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap text-right tabular-nums">
                      {franchise._count.cities}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap text-right tabular-nums hidden sm:table-cell">
                      {franchise._count.members}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {franchises.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-medium">Франшизы не найдены</p>
              <p className="text-sm mt-1">Создайте первую франшизу</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
