'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus } from 'lucide-react'
import Link from 'next/link'
import { GroupDealCard, type GroupDealData } from '@/components/GroupDealCard'
import { useAuth } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [groups, setGroups] = useState<GroupDealData[]>([])
  const [loading, setLoading] = useState(true)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/group-deals')
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groupDeals || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?next=/groups')
      return
    }
    if (!authLoading && user) {
      loadGroups()
    }
  }, [user, authLoading, loadGroups, router])

  const handleGroupUpdated = useCallback((updated: GroupDealData) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? updated : g))
  }, [])

  const activeGroups = groups.filter(g => g.status === 'OPEN' || g.status === 'READY')
  const finishedGroups = groups.filter(g => g.status === 'COMPLETED' || g.status === 'EXPIRED')

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-blue-700 text-white pt-6 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-blue-100 mb-4">
            <Users className="w-3.5 h-3.5" />
            Групповые скидки
          </div>
          <h1 className="text-2xl font-bold mb-2">Пойдём вместе</h1>
          <p className="text-blue-100 text-sm">
            Собирайте компанию и получайте дополнительные +5% к скидке при совместном погашении.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* CTA to browse offers */}
        <Link
          href="/offers"
          className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Создать новую группу</p>
              <p className="text-xs text-gray-400">Выберите предложение и пригласите друзей</p>
            </div>
          </div>
          <span className="text-gray-300 text-lg">&rsaquo;</span>
        </Link>

        {authLoading || loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <>
            {/* Active groups */}
            {activeGroups.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Активные группы
                </h2>
                <div className="space-y-3">
                  {activeGroups.map(group => (
                    <GroupDealCard
                      key={group.id}
                      groupDeal={group}
                      onJoined={handleGroupUpdated}
                      showOffer
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {activeGroups.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">&#x1F46B;</div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Нет активных групп</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Создайте группу на странице любого предложения или попросите друга поделиться ссылкой.
                </p>
                <Link
                  href="/offers"
                  className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  Смотреть скидки
                </Link>
              </div>
            )}

            {/* Finished groups */}
            {finishedGroups.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  История групп
                </h2>
                <div className="space-y-3">
                  {finishedGroups.map(group => (
                    <GroupDealCard
                      key={group.id}
                      groupDeal={group}
                      showOffer
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
