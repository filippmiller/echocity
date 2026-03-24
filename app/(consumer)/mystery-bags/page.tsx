'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MysteryBag {
  id: string
  title: string
  salePrice: number
  originalValue: number
  contentsHint: string
  pickupWindowStart: string
  pickupWindowEnd: string
  remaining: number
  totalQuantity: number
  branch: { title: string; address: string }
  merchantName: string
}

export default function MysteryBagsPage() {
  const [bags, setBags] = useState<MysteryBag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/offers/mystery-bags')
      .then((r) => r.json())
      .then((d) => setBags(d.bags || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Сюрприз-пакеты</h1>
      <p className="text-gray-500 text-sm mb-6">
        Еда из кафе и ресторанов со скидкой до 70% — забирайте перед закрытием
      </p>

      {loading && (
        <div className="text-center py-12 text-gray-400">Загрузка...</div>
      )}

      {!loading && bags.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">Пока нет доступных пакетов</p>
          <p className="text-gray-300 text-sm">Загляните позже — пакеты появляются ближе к вечеру</p>
        </div>
      )}

      <div className="space-y-4">
        {bags.map((bag) => {
          const savings = Math.round((1 - bag.salePrice / bag.originalValue) * 100)
          return (
            <Link
              key={bag.id}
              href={`/offers/${bag.id}`}
              className="block bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                    -{savings}%
                  </span>
                  <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                    Осталось {bag.remaining} из {bag.totalQuantity}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 line-through text-sm">{bag.originalValue}₽</span>
                  <span className="ml-2 text-emerald-600 font-bold text-lg">{bag.salePrice}₽</span>
                </div>
              </div>

              <h3 className="font-semibold mb-1">{bag.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{bag.contentsHint}</p>

              <div className="flex justify-between text-xs text-gray-400">
                <span>{bag.branch.title} — {bag.merchantName}</span>
                <span>Забрать: {bag.pickupWindowStart}–{bag.pickupWindowEnd}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
