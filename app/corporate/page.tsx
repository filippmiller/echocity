'use client'

import { useState, useEffect } from 'react'

interface Employee {
  userId: string
  name: string
  email: string
  coinBalance: number
  addedAt: string
}

interface Dashboard {
  plan: {
    id: string
    companyName: string
    maxSeats: number
    monthlyBudget: number
    status: string
  }
  employees: Employee[]
  stats: {
    activeSeats: number
    monthlyCreditsDistributed: number
    monthlyRedemptions: number
  }
}

export default function CorporateDashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [planId, setPlanId] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    // For now, get the planId from URL or check user's corporate membership
    const urlPlanId = new URLSearchParams(window.location.search).get('planId')
    if (urlPlanId) {
      setPlanId(urlPlanId)
      fetch(`/api/corporate/${urlPlanId}`)
        .then((r) => r.json())
        .then(setDashboard)
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planId || !newEmail) return
    setAdding(true)
    try {
      const res = await fetch(`/api/corporate/${planId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      })
      if (res.ok) {
        setNewEmail('')
        // Refresh dashboard
        const data = await fetch(`/api/corporate/${planId}`).then((r) => r.json())
        setDashboard(data)
      } else {
        const data = await res.json()
        alert(data.error || 'Ошибка')
      }
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Загрузка...</div>

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Нет активного корпоративного плана</p>
        <p className="text-gray-400 text-sm mt-2">
          Свяжитесь с нами для подключения: corp@echocity.ru
        </p>
      </div>
    )
  }

  const { plan, employees, stats } = dashboard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border">
        <h2 className="text-xl font-bold mb-1">{plan.companyName}</h2>
        <p className="text-gray-500 text-sm">
          {stats.activeSeats} / {plan.maxSeats} мест занято
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.activeSeats}</p>
          <p className="text-xs text-gray-500">Сотрудников</p>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.monthlyCreditsDistributed}</p>
          <p className="text-xs text-gray-500">Монет в этом месяце</p>
        </div>
        <div className="bg-white rounded-xl p-4 border text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.monthlyRedemptions}</p>
          <p className="text-xs text-gray-500">Использований</p>
        </div>
      </div>

      {/* Add employee */}
      <div className="bg-white rounded-xl p-4 border">
        <h3 className="font-semibold mb-3">Добавить сотрудника</h3>
        <form onSubmit={handleAddEmployee} className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@company.com"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {adding ? '...' : 'Добавить'}
          </button>
        </form>
      </div>

      {/* Employee list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <h3 className="font-semibold p-4 border-b">Сотрудники</h3>
        <div className="divide-y">
          {employees.map((emp) => (
            <div key={emp.userId} className="px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{emp.name}</p>
                <p className="text-xs text-gray-400">{emp.email}</p>
              </div>
              <span className="text-sm font-medium text-emerald-600">
                {emp.coinBalance} монет
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
