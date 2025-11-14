'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [error, setError] = useState<string | null>(null)
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
    } catch (err) {
      setError('Ошибка при загрузке франшиз')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const payload: any = {
        code: formData.code,
        name: formData.name,
        ownerUserEmail: formData.ownerUserEmail,
        status: formData.status,
      }

      if (formData.billingEmail) {
        payload.billingEmail = formData.billingEmail
      }
      if (formData.billingPlan) {
        payload.billingPlan = formData.billingPlan
      }
      if (formData.revenueSharePercent) {
        payload.revenueSharePercent = parseInt(formData.revenueSharePercent)
      }

      const res = await fetch('/api/admin/franchises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка при создании франшизы')
        return
      }

      // Reset form and reload
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
    } catch (err) {
      setError('Ошибка при создании франшизы')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Управление франшизами</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Отмена' : 'Создать франшизу'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Новая франшиза</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Код *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    pattern="[A-Z0-9-_]+"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email владельца *
                  </label>
                  <input
                    type="email"
                    value={formData.ownerUserEmail}
                    onChange={(e) => setFormData({ ...formData, ownerUserEmail: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Статус *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="DRAFT">Черновик</option>
                    <option value="ACTIVE">Активна</option>
                    <option value="SUSPENDED">Приостановлена</option>
                    <option value="EXPIRED">Истекла</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email для биллинга
                  </label>
                  <input
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    План биллинга
                  </label>
                  <input
                    type="text"
                    value={formData.billingPlan}
                    onChange={(e) => setFormData({ ...formData, billingPlan: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Процент дохода (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.revenueSharePercent}
                    onChange={(e) => setFormData({ ...formData, revenueSharePercent: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Создание...' : 'Создать'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Код
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Владелец
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Городов
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Участников
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {franchises.map((franchise) => (
                <tr key={franchise.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {franchise.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {franchise.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        franchise.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : franchise.status === 'SUSPENDED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : franchise.status === 'EXPIRED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {franchise.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {franchise.ownerUser.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {franchise._count.cities}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {franchise._count.members}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {franchises.length === 0 && (
            <div className="px-6 py-4 text-center text-gray-500">
              Франшизы не найдены
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

