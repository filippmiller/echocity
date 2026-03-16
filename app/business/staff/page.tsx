'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'

interface StaffMember {
  id: string
  staffRole: string
  user: { firstName: string; email: string }
  branch: { title: string } | null
}

export default function StaffPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStaff = () => {
    fetch('/api/business/staff')
      .then((r) => r.json())
      .then((data) => { setStaff(data.staff || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') loadStaff()
  }, [user])

  const handleInvite = async () => {
    setInviting(true)
    setError(null)
    const res = await fetch('/api/business/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, merchantId: '' }), // Will need merchantId from context
    })
    if (res.ok) {
      setEmail('')
      loadStaff()
    } else {
      const data = await res.json()
      setError(data.error)
    }
    setInviting(false)
  }

  const handleRemove = async (id: string) => {
    await fetch(`/api/business/staff/${id}`, { method: 'DELETE' })
    loadStaff()
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Загрузка...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Сотрудники</h1>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Добавить сотрудника</h3>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email сотрудника"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={handleInvite} disabled={inviting || !email}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            Добавить
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {staff.length === 0 ? (
        <p className="text-gray-500 text-center">Нет сотрудников</p>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{s.user.firstName}</p>
                <p className="text-sm text-gray-500">{s.user.email} — {s.staffRole}</p>
                {s.branch && <p className="text-xs text-gray-400">{s.branch.title}</p>}
              </div>
              <button onClick={() => handleRemove(s.id)} className="text-sm text-red-600 hover:underline">
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
