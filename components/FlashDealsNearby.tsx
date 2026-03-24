'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FlashDeal {
  id: string
  title: string
  endAt: string
  benefitValue: number
  benefitType: string
  branch: { title: string }
  merchant: { name: string }
  hotReason: string
}

function Countdown({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(endAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Завершена')
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [endAt])

  return <span className="font-mono text-red-600 font-bold">{timeLeft}</span>
}

export default function FlashDealsNearby() {
  const [deals, setDeals] = useState<FlashDeal[]>([])

  useEffect(() => {
    fetch('/api/offers/hot')
      .then((r) => r.json())
      .then((d) => {
        const flashOnly = (d.offers || []).filter(
          (o: FlashDeal) => o.hotReason === 'flash'
        )
        setDeals(flashOnly)
      })
      .catch(() => {})
  }, [])

  if (deals.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="animate-pulse text-red-500">●</span>
        Скидки прямо сейчас
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {deals.map((deal) => (
          <Link
            key={deal.id}
            href={`/offers/${deal.id}`}
            className="snap-start flex-shrink-0 w-64 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                FLASH
              </span>
              <Countdown endAt={deal.endAt} />
            </div>
            <p className="font-semibold text-sm line-clamp-2 mb-1">{deal.title}</p>
            <p className="text-xs text-gray-500">
              {deal.branch?.title || deal.merchant?.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
