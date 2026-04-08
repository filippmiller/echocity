'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { Users, UserPlus, Trash2, Crown, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface FamilyMember {
  id: string
  userId: string
  addedAt: string
  user: { id: string; email: string; firstName: string; lastName?: string | null }
}

interface FamilyPlanData {
  id: string
  ownerUserId: string
  maxMembers: number
  members: FamilyMember[]
  subscription: {
    plan: { code: string; name: string }
  }
}

interface MembershipData {
  familyPlan: {
    owner: { id: string; email: string; firstName: string }
    subscription: { plan: { code: string; name: string } }
  }
}

export default function FamilyPage() {
  const { user, loading: authLoading } = useAuth()
  const [familyPlan, setFamilyPlan] = useState<FamilyPlanData | null>(null)
  const [membership, setMembership] = useState<MembershipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchData = () => {
    fetch('/api/family')
      .then((r) => r.json())
      .then((data) => {
        setFamilyPlan(data.familyPlan || null)
        setMembership(data.membership || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user) fetchData()
    else setLoading(false)
  }, [user])

  const handleCreate = async () => {
    setActionLoading(true)
    setError(null)
    const res = await fetch('/api/family', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setFamilyPlan(data.familyPlan)
      setSuccess('Семейный план создан')
    } else {
      setError(data.error || 'Ошибка создания')
    }
    setActionLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    const res = await fetch('/api/family/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setEmail('')
      setSuccess(`${data.member.user.firstName} добавлен(а) в семейный план`)
      fetchData()
    } else {
      setError(data.error || 'Ошибка приглашения')
    }
    setActionLoading(false)
  }

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Удалить ${name} из семейного плана?`)) return
    setActionLoading(true)
    setError(null)
    const res = await fetch('/api/family/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (res.ok) {
      setSuccess('Участник удалён')
      fetchData()
    } else {
      const data = await res.json()
      setError(data.error || 'Ошибка удаления')
    }
    setActionLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Семейный план</h2>
        <p className="text-gray-500 mb-6">Войдите, чтобы управлять семейным планом</p>
        <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
          Войти &rarr;
        </Link>
      </div>
    )
  }

  // User is a member of someone else's plan
  if (membership) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white pt-6 pb-10 px-4 text-center">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h1 className="text-2xl font-bold mb-2">Семейный план</h1>
          <p className="text-blue-200">Вы участник семейного плана</p>
        </div>
        <div className="max-w-2xl mx-auto px-4 -mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-gray-700">
              Владелец плана: <span className="font-semibold">{membership.familyPlan.owner.firstName}</span> ({membership.familyPlan.owner.email})
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Тариф: {membership.familyPlan.subscription.plan.name}
            </p>
            <p className="text-sm text-green-600 mt-2 font-medium">
              Вы получаете все преимущества подписки как участник семейного плана.
            </p>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white pt-6 pb-10 px-4 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
        <h1 className="text-2xl font-bold mb-2">Семейный план</h1>
        <p className="text-blue-200 max-w-md mx-auto">
          Добавьте близких и делитесь преимуществами подписки
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {/* Error / Success messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3 mb-4">
            {success}
          </div>
        )}

        {!familyPlan ? (
          /* No family plan yet */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Создайте семейный план</h2>
            <p className="text-sm text-gray-500 mb-1">
              Делитесь подпиской с близкими. Plus: до 2 участников, Premium: до 4.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Необходима активная подписка Plus или Premium.
            </p>
            <button
              onClick={handleCreate}
              disabled={actionLoading}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              Создать семейный план
            </button>
          </div>
        ) : (
          /* Family plan exists */
          <div className="space-y-4">
            {/* Plan info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-gray-900">Ваш семейный план</h2>
              </div>
              <p className="text-sm text-gray-600">
                Тариф: <span className="font-medium">{familyPlan.subscription.plan.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Участников: <span className="font-medium">{familyPlan.members.length} / {familyPlan.maxMembers}</span>
              </p>
            </div>

            {/* Members list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Участники</h3>
              {familyPlan.members.length === 0 ? (
                <p className="text-sm text-gray-400">Пока нет участников. Пригласите кого-нибудь!</p>
              ) : (
                <div className="space-y-3">
                  {familyPlan.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.user.firstName} {member.user.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500">{member.user.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Добавлен: {new Date(member.addedAt).toLocaleDateString('ru')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(member.id, member.user.firstName)}
                        disabled={actionLoading}
                        className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invite form */}
            {familyPlan.members.length < familyPlan.maxMembers && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-gray-700">Пригласить участника</h3>
                </div>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email пользователя"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                    required
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !email.trim()}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    Добавить
                  </button>
                </form>
              </div>
            )}

            {familyPlan.members.length >= familyPlan.maxMembers && (
              <p className="text-sm text-gray-500 text-center">
                Достигнут максимум участников ({familyPlan.maxMembers}).
                {familyPlan.subscription.plan.code === 'plus' && (
                  <> <Link href="/subscription" className="text-brand-600 hover:underline">Перейдите на Premium</Link> для расширения до 4 участников.</>
                )}
              </p>
            )}
          </div>
        )}
      </div>


    </div>
  )
}
