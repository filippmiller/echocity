'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Share2, Clock, CheckCircle, XCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-client'

export interface GroupDealMemberData {
  id: string
  userId: string
  hasRedeemed: boolean
  joinedAt: string
  user: { id: string; firstName: string; lastName: string | null }
}

export interface GroupDealData {
  id: string
  offerId: string
  status: 'OPEN' | 'READY' | 'COMPLETED' | 'EXPIRED'
  minMembers: number
  bonusPercent: number
  expiresAt: string
  createdAt: string
  creator: { id: string; firstName: string; lastName: string | null }
  members: GroupDealMemberData[]
  offer?: {
    id: string
    title: string
    benefitType: string
    benefitValue: number
    branch?: { id: string; title: string; address?: string }
  }
}

interface GroupDealCardProps {
  groupDeal: GroupDealData
  onJoined?: (updated: GroupDealData) => void
  showOffer?: boolean
}

function getInitials(firstName: string, lastName: string | null): string {
  return (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase()
}

function getStatusInfo(status: GroupDealData['status']) {
  switch (status) {
    case 'OPEN':
      return { label: 'Набираем', color: 'bg-emerald-100 text-emerald-700' }
    case 'READY':
      return { label: 'Готово!', color: 'bg-blue-100 text-blue-700' }
    case 'COMPLETED':
      return { label: 'Выполнено', color: 'bg-gray-100 text-gray-600' }
    case 'EXPIRED':
      return { label: 'Истекло', color: 'bg-gray-100 text-gray-400' }
  }
}

function useCountdown(expiresAt: string) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Истекло')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 0) setTimeLeft(`${h}ч ${m}м`)
      else if (m > 0) setTimeLeft(`${m}м ${s}с`)
      else setTimeLeft(`${s}с`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return timeLeft
}

export function GroupDealCard({ groupDeal, onJoined, showOffer = false }: GroupDealCardProps) {
  const { user } = useAuth()
  const [joining, setJoining] = useState(false)
  const timeLeft = useCountdown(groupDeal.expiresAt)

  const memberCount = groupDeal.members.length
  const progress = Math.min(memberCount / groupDeal.minMembers, 1)
  const isMember = user ? groupDeal.members.some(m => m.userId === user.userId) : false
  const isExpiredOrDone = groupDeal.status === 'EXPIRED' || groupDeal.status === 'COMPLETED'
  const statusInfo = getStatusInfo(groupDeal.status)

  const shareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/offers/${groupDeal.offerId}?group=${groupDeal.id}`
      : `/offers/${groupDeal.offerId}?group=${groupDeal.id}`

  const handleShare = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink).then(() => {
        toast.success('Ссылка скопирована!')
      })
    } else {
      toast.info('Ссылка: ' + shareLink)
    }
  }, [shareLink])

  const handleJoin = useCallback(async () => {
    if (!user) {
      toast.error('Войдите, чтобы присоединиться')
      return
    }
    setJoining(true)
    try {
      const res = await fetch(`/api/group-deals/${groupDeal.id}/join`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось присоединиться')
        return
      }
      if (data.alreadyMember) {
        toast.info('Вы уже в этой группе')
      } else {
        toast.success('Вы присоединились к группе!')
      }
      onJoined?.(data.groupDeal)
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setJoining(false)
    }
  }, [user, groupDeal.id, onJoined])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {groupDeal.creator.firstName} {groupDeal.creator.lastName ?? ''}
            </p>
            <p className="text-xs text-gray-400">организатор</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Offer info (optional) */}
      {showOffer && groupDeal.offer && (
        <p className="text-xs text-gray-500 mb-3 truncate">
          {groupDeal.offer.branch?.title} — {groupDeal.offer.title}
        </p>
      )}

      {/* Bonus badge */}
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-600">
          +{groupDeal.bonusPercent}% бонусная скидка при групповом погашении
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{memberCount} из {groupDeal.minMembers} участников</span>
          {groupDeal.status === 'READY' && (
            <span className="text-blue-600 font-semibold">Можно погашать!</span>
          )}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              groupDeal.status === 'READY' ? 'bg-blue-500' : 'bg-brand-500'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Member avatars */}
      <div className="flex items-center gap-1.5 mb-4">
        {groupDeal.members.slice(0, 6).map((member) => (
          <div
            key={member.id}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
              member.userId === groupDeal.creator.id ? 'bg-brand-600' : 'bg-gray-400'
            }`}
            title={`${member.user.firstName} ${member.user.lastName ?? ''}`}
          >
            {getInitials(member.user.firstName, member.user.lastName)}
          </div>
        ))}
        {memberCount > 6 && (
          <span className="text-xs text-gray-400 ml-1">+{memberCount - 6}</span>
        )}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, groupDeal.minMembers - memberCount) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 shrink-0"
          />
        ))}
      </div>

      {/* Expiry */}
      {!isExpiredOrDone && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Осталось: {timeLeft}</span>
        </div>
      )}

      {/* Status icons for done/expired */}
      {groupDeal.status === 'COMPLETED' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 mb-4">
          <CheckCircle className="w-4 h-4" />
          <span>Группа успешно завершила погашение</span>
        </div>
      )}
      {groupDeal.status === 'EXPIRED' && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <XCircle className="w-4 h-4" />
          <span>Время группы истекло</span>
        </div>
      )}

      {/* Actions */}
      {!isExpiredOrDone && (
        <div className="flex gap-2">
          {!isMember && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {joining ? 'Подождите...' : 'Присоединиться'}
            </button>
          )}
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors ${
              isMember ? 'flex-1 justify-center' : ''
            }`}
          >
            <Share2 className="w-4 h-4" />
            Поделиться
          </button>
        </div>
      )}
    </div>
  )
}
