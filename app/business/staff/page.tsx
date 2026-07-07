'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'

interface StaffMember {
  id: string
  staffRole: string
  user: { firstName: string; email: string }
  branch: { title: string } | null
}

interface Business {
  id: string
  name: string
}

export default function StaffPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [staffRole, setStaffRole] = useState<'CASHIER' | 'MANAGER'>('CASHIER')
  const [inviting, setInviting] = useState(false)

  const canAccess = Boolean(
    user && (user.role === 'BUSINESS_OWNER' || user.staffRole === 'MANAGER')
  )
  const isOwner = user?.role === 'BUSINESS_OWNER'

  const loadStaff = () => {
    fetch('/api/business/staff')
      .then((r) => r.json())
      .then((data) => { setStaff(data.staff || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const loadBusinesses = () => {
    fetch('/api/business/places')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.businesses || []).map((b: Business) => ({ id: b.id, name: b.name }))
        setBusinesses(list)
        if (list.length > 0 && !merchantId) {
          setMerchantId(list[0].id)
        }
      })
  }

  useEffect(() => {
    if (!canAccess) {
      setLoading(false)
      return
    }
    loadStaff()
    loadBusinesses()
  }, [canAccess])

  const handleInvite = async () => {
    if (!merchantId) {
      toast.error('Выберите заведение')
      return
    }
    setInviting(true)
    try {
      const res = await fetch('/api/business/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, merchantId, staffRole }),
      })
      if (res.ok) {
        setEmail('')
        setStaffRole('CASHIER')
        toast.success('Сотрудник добавлен')
        loadStaff()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при добавлении')
      }
    } catch {
      toast.error('Ошибка сети')
    }
    setInviting(false)
  }

  const handleRemove = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/business/staff/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${name} удалён из команды`)
        loadStaff()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при удалении')
      }
    } catch {
      toast.error('Ошибка сети')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-20 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-2xl">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm text-center">
          Доступ запрещён
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Сотрудники</h1>

      {/* Invite form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Добавить сотрудника</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email сотрудника"
              type="email"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !email || !merchantId}
              className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {inviting ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Выберите заведение</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as 'CASHIER' | 'MANAGER')}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="CASHIER">Кассир</option>
              {isOwner && <option value="MANAGER">Менеджер</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Staff list */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM7 9.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-gray-500">Нет сотрудников</p>
          <p className="text-sm text-gray-400 mt-1">Добавьте первого сотрудника через форму выше</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-deal-premium/10 flex items-center justify-center text-deal-premium text-xs font-bold shrink-0">
                    {s.user.firstName[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{s.user.firstName}</p>
                    <p className="text-xs text-gray-500 truncate">{s.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 ml-10">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-600">
                    {s.staffRole}
                  </span>
                  {s.branch && (
                    <span className="text-xs text-gray-400">{s.branch.title}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemove(s.id, s.user.firstName)}
                className="text-sm text-red-500 hover:text-red-700 font-medium shrink-0 ml-3"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
