'use client'

import { useEffect, useState } from 'react'
import { Flame, Lock, CheckCircle2 } from 'lucide-react'

interface StreakData {
  streakCurrent: number
  streakLongest: number
}

interface Reward {
  days: number
  label: string
  description: string
}

const REWARDS: Reward[] = [
  { days: 3, label: 'Скрытые предложения', description: 'Открывается доступ к закрытым акциям' },
  { days: 7, label: 'Скидка +5%', description: 'Дополнительные 5% к любой скидке' },
  { days: 14, label: 'Ранний доступ к флэш-акциям', description: 'Вы первым узнаёте о выгодных предложениях' },
  { days: 30, label: 'Бесплатный месяц', description: 'Продление подписки без оплаты' },
]

function getDayWord(n: number): string {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 19) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

export function StreakRewards() {
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    fetch('/api/streak')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  const current = data?.streakCurrent ?? 0

  // Find next reward threshold
  const nextReward = REWARDS.find((r) => r.days > current)
  const progressToNext = nextReward
    ? Math.min((current / nextReward.days) * 100, 100)
    : 100

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900">Награды за серию входов</h3>
      </div>

      {/* Current streak summary */}
      <div className="mb-4 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
        <p className="text-sm text-gray-600">
          Текущая серия: <span className="font-bold text-orange-600">{current} {getDayWord(current)}</span>
        </p>
        {nextReward && (
          <p className="text-xs text-gray-500 mt-0.5">
            До следующей награды: {nextReward.days - current} {getDayWord(nextReward.days - current)}
          </p>
        )}
      </div>

      {/* Progress bar to next reward */}
      {nextReward && (
        <div className="mb-5">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{current} дн.</span>
            <span>{nextReward.days} дн.</span>
          </div>
        </div>
      )}

      {/* Rewards list */}
      <ul className="space-y-3">
        {REWARDS.map((reward) => {
          const unlocked = current >= reward.days
          return (
            <li
              key={reward.days}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                unlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${unlocked ? 'text-emerald-500' : 'text-gray-300'}`}>
                {unlocked ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${unlocked ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {reward.label}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    unlocked ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {reward.days} {getDayWord(reward.days)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{reward.description}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
