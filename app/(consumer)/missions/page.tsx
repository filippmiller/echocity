'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { BadgesGrid } from '@/components/BadgesGrid'

interface MissionData {
  id: string
  code: string
  title: string
  description: string
  iconEmoji: string
  targetValue: number
  xpReward: number
  currentValue: number
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  completedAt: string | null
}

interface GamificationProfile {
  totalXp: number
  level: number
  nextLevelXp: number
  prevLevelXp: number
  levelProgress: number
  activeMissions: number
  completedMissions: number
  badgeCount: number
}

interface MissionsResponse {
  missions: MissionData[]
  active: MissionData[]
  completed: MissionData[]
}

function formatProgress(current: number, target: number, code: string): string {
  if (code === 'BIG_SAVER') {
    const currentRub = Math.floor(current / 100)
    const targetRub = Math.floor(target / 100)
    return `${currentRub.toLocaleString('ru-RU')} / ${targetRub.toLocaleString('ru-RU')} ₽`
  }
  return `${current} / ${target}`
}

function XPBar({ profile }: { profile: GamificationProfile }) {
  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">Ур. {profile.level}</span>
        </div>
        <span className="text-sm text-brand-200">{profile.totalXp} XP</span>
      </div>

      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden mt-3">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-amber-300 to-amber-400"
          style={{ width: `${profile.levelProgress}%` }}
        />
      </div>

      <div className="flex justify-between mt-1.5 text-xs text-brand-200">
        <span>{profile.prevLevelXp} XP</span>
        <span>{profile.nextLevelXp} XP</span>
      </div>

      <div className="flex gap-4 mt-4 pt-3 border-t border-white/20">
        <div className="text-center flex-1">
          <p className="text-xl font-bold">{profile.activeMissions}</p>
          <p className="text-[11px] text-brand-200">Активных</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xl font-bold">{profile.completedMissions}</p>
          <p className="text-[11px] text-brand-200">Выполнено</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xl font-bold">{profile.badgeCount}</p>
          <p className="text-[11px] text-brand-200">Значков</p>
        </div>
      </div>
    </div>
  )
}

function MissionCard({ mission }: { mission: MissionData }) {
  const isCompleted = mission.status === 'COMPLETED'
  const percent = Math.min((mission.currentValue / mission.targetValue) * 100, 100)

  return (
    <div
      className={`p-4 rounded-2xl transition-colors ${
        isCompleted ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{isCompleted ? '✅' : mission.iconEmoji}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`text-sm font-semibold ${
                isCompleted ? 'text-emerald-800' : 'text-gray-900'
              }`}
            >
              {mission.title}
            </h4>
            <span
              className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}
            >
              +{mission.xpReward} XP
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-0.5">{mission.description}</p>

          {!isCompleted && (
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-brand-500 to-brand-600"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {formatProgress(mission.currentValue, mission.targetValue, mission.code)}
              </p>
            </div>
          )}

          {isCompleted && mission.completedAt && (
            <p className="text-[11px] text-emerald-600 mt-1">
              Выполнено {new Date(mission.completedAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

type Tab = 'active' | 'completed'

export default function MissionsPage() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null)
  const [missions, setMissions] = useState<MissionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('active')

  useEffect(() => {
    Promise.all([
      fetch('/api/gamification/profile').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/gamification/missions').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([profileData, missionsData]) => {
        setProfile(profileData)
        setMissions(missionsData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const activeMissions = missions?.active ?? []
  const completedMissions = missions?.completed ?? []
  const displayed = activeTab === 'active' ? activeMissions : completedMissions

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Миссии и достижения</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* XP Bar */}
        {profile && <XPBar profile={profile} />}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Активные ({activeMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'completed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Выполнено ({completedMissions.length})
          </button>
        </div>

        {/* Missions list */}
        <div className="space-y-3">
          {displayed.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">{activeTab === 'active' ? '🎯' : '🏆'}</p>
              <p className="text-sm text-gray-500">
                {activeTab === 'active'
                  ? 'Нет активных миссий'
                  : 'Пока нет выполненных миссий'}
              </p>
            </div>
          ) : (
            displayed.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))
          )}
        </div>

        {/* Badges section */}
        <div className="pt-2">
          <BadgesGrid />
        </div>
      </div>
    </div>
  )
}
