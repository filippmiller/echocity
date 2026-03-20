'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Coins, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface CoinTransaction {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

interface CoinWalletData {
  balance: number
  transactions: CoinTransaction[]
}

function AnimatedBalance({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    if (from === to) return

    prevRef.current = to

    const steps = 20
    const duration = 600
    const stepTime = duration / steps
    const diff = to - from

    let step = 0
    const timer = setInterval(() => {
      step++
      setDisplay(Math.round(from + (diff * step) / steps))
      if (step >= steps) {
        clearInterval(timer)
        setDisplay(to)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [value])

  return <>{display}</>
}

export function CoinWallet() {
  const [data, setData] = useState<CoinWalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coins')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-lg w-40 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-24" />
      </div>
    )
  }

  const balance = data?.balance ?? 0

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 p-5">
      {/* Balance */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">EchoCoins</p>
            <p className="text-3xl font-bold text-amber-900 leading-none">
              <AnimatedBalance value={balance} />
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-amber-700">= {balance}₽</p>
          <p className="text-xs text-amber-600 mt-0.5">1 монета = 1₽</p>
        </div>
      </div>

      {/* Divider */}
      {(data?.transactions?.length ?? 0) > 0 && (
        <div className="mt-4 mb-3 border-t border-amber-100" />
      )}

      {/* Recent transactions */}
      {(data?.transactions?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Последние операции</p>
          {data!.transactions.slice(0, 3).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tx.amount > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span className="text-sm text-gray-700 truncate max-w-[180px]">{tx.description}</span>
              </div>
              <span
                className={`text-sm font-semibold ml-2 shrink-0 ${
                  tx.amount > 0 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {(data?.transactions?.length ?? 0) === 0 && (
        <p className="text-sm text-amber-700 mt-2">
          Активируйте первую скидку и получите кэшбэк монетами!
        </p>
      )}

      {/* History link */}
      <Link
        href="/wallet"
        className="mt-4 flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
      >
        История операций
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
