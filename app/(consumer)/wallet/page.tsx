'use client'

import { useEffect, useState, useCallback } from 'react'
import { Coins, TrendingUp, TrendingDown, Gift, Users, Zap } from 'lucide-react'

interface CoinTransaction {
  id: string
  amount: number
  type: string
  description: string
  referenceId: string | null
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  REDEMPTION_CASHBACK: 'Кэшбэк за скидку',
  REFERRAL_BONUS: 'Бонус за приглашение',
  STREAK_BONUS: 'Бонус за серию',
  SUBSCRIPTION_PAYMENT: 'Оплата подписки',
  MANUAL_ADJUSTMENT: 'Бонус от ГдеСейчас',
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    try {
      const [coinsRes, historyRes] = await Promise.all([
        fetch('/api/coins'),
        fetch('/api/coins/history'),
      ])
      if (coinsRes.ok) {
        const d = await coinsRes.json()
        setBalance(d.balance)
      }
      if (historyRes.ok) {
        const d = await historyRes.json()
        setTransactions(d.transactions)
        setNextCursor(d.nextCursor)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInitial() }, [fetchInitial])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/coins/history?cursor=${nextCursor}`)
      if (res.ok) {
        const d = await res.json()
        setTransactions((prev) => [...prev, ...d.transactions])
        setNextCursor(d.nextCursor)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-100 uppercase tracking-wide">EchoCoins</p>
            <p className="text-5xl font-bold leading-none">
              {loading ? '—' : balance}
            </p>
          </div>
        </div>
        <p className="text-amber-100 text-sm mt-3">
          {loading ? '' : `Эквивалент: ${balance}₽ • 1 монета = 1 рубль`}
        </p>
        <p className="text-amber-100 text-xs mt-1">
          Используйте монеты для оплаты подписки
        </p>
      </div>

      {/* How to earn more */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Как заработать больше?</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Активируйте скидки</p>
              <p className="text-xs text-gray-500">3% от суммы скидки возвращается монетами</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Приглашайте друзей</p>
              <p className="text-xs text-gray-500">Бонус за каждого пришедшего по вашей ссылке</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Поддерживайте серии</p>
              <p className="text-xs text-gray-500">Бонусные монеты за ежедневные серии активаций</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Оплачивайте подписку</p>
              <p className="text-xs text-gray-500">Монеты засчитываются при продлении подписки</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">История операций</h2>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="text-center py-8">
            <Coins className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Операций пока нет.</p>
            <p className="text-xs text-gray-400 mt-1">Активируйте первую скидку!</p>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => {
              const isEarn = tx.amount > 0
              return (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isEarn ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {isEarn ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-400">
                        {TYPE_LABELS[tx.type] ?? tx.type} •{' '}
                        {new Date(tx.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ml-2 shrink-0 ${
                      isEarn ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {isEarn ? '+' : ''}{tx.amount}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-4 w-full py-2.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Загрузка...' : 'Показать ещё'}
          </button>
        )}
      </div>
    </div>
  )
}
