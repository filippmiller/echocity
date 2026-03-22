'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Trophy, PiggyBank, Tag, Star, Loader2 } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  avatarUrl: string | null
  value: number
  unit: string
}

interface LeaderboardData {
  month: string
  savers: LeaderboardEntry[]
  redeemers: LeaderboardEntry[]
  reviewers: LeaderboardEntry[]
}

const TABS = [
  { key: 'savers', label: 'Экономисты', icon: PiggyBank, color: 'text-emerald-600' },
  { key: 'redeemers', label: 'Охотники', icon: Tag, color: 'text-brand-600' },
  { key: 'reviewers', label: 'Критики', icon: Star, color: 'text-amber-600' },
] as const

function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}`
}

function getMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  return `${months[parseInt(month) - 1]} ${year}`
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'savers' | 'redeemers' | 'reviewers'>('savers')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const entries = data ? data[activeTab] : []

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/profile" className="flex items-center gap-1 text-amber-200 text-sm mb-3">
            <ChevronLeft className="w-4 h-4" />
            Профиль
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Лидерборд</h1>
              <p className="text-amber-100 text-sm">
                {data ? getMonthName(data.month) : 'Загрузка...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-14 z-20 bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-2xl mx-auto flex gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Пока нет данных</p>
            <p className="text-sm text-gray-400 mt-1">Начните использовать скидки — станьте первым!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm ${
                  entry.rank <= 3 ? 'border border-amber-100' : ''
                }`}
              >
                {/* Rank */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-bold">
                  {entry.rank <= 3 ? (
                    <span>{getRankEmoji(entry.rank)}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-bold shrink-0">
                    {entry.name[0]?.toUpperCase() || '?'}
                  </div>
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">
                    {entry.value.toLocaleString('ru-RU')}
                  </p>
                  <p className="text-[10px] text-gray-400">{entry.unit}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-amber-50 rounded-2xl p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-800 mb-1">Как попасть в топ?</p>
          <ul className="space-y-1">
            <li>• Используйте больше скидок в течение месяца</li>
            <li>• Оставляйте отзывы после каждого визита</li>
            <li>• Лидерборд обновляется каждый месяц</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
