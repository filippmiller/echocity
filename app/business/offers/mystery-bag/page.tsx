'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MysteryBagPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    branchId: '',
    title: 'Сюрприз-пакет',
    salePrice: 300,
    originalValue: 800,
    contentsHint: '',
    pickupWindowStart: '19:00',
    pickupWindowEnd: '21:00',
    quantity: 5,
  })

  useEffect(() => {
    fetch('/api/business/places')
      .then((r) => r.json())
      .then((d) => {
        const places = d.places || d || []
        setBranches(places)
        if (places.length > 0) setForm((f) => ({ ...f, branchId: places[0].id }))
      })
      .catch(() => {})
  }, [])

  const savings = form.originalValue > 0
    ? Math.round((1 - form.salePrice / form.originalValue) * 100)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/business/offers/mystery-bag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push('/business/offers')
      } else {
        const data = await res.json()
        alert(data.error || 'Ошибка создания')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Сюрприз-пакет</h1>
      <p className="text-gray-500 text-sm mb-6">
        Продайте остатки дня со скидкой — покупатели получат пакет-сюрприз
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Филиал</label>
          <select
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Название</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Что примерно внутри</label>
          <textarea
            value={form.contentsHint}
            onChange={(e) => setForm({ ...form, contentsHint: e.target.value })}
            placeholder="Выпечка, десерты, сэндвичи..."
            className="w-full border rounded-lg px-3 py-2"
            rows={2}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Реальная стоимость, ₽</label>
            <input
              type="number"
              value={form.originalValue}
              onChange={(e) => setForm({ ...form, originalValue: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2"
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Цена пакета, ₽</label>
            <input
              type="number"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2"
              min={1}
              required
            />
          </div>
        </div>

        {savings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <span className="text-green-700 font-bold text-lg">Экономия {savings}%</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Забрать с</label>
            <input
              type="time"
              value={form.pickupWindowStart}
              onChange={(e) => setForm({ ...form, pickupWindowStart: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Забрать до</label>
            <input
              type="time"
              value={form.pickupWindowEnd}
              onChange={(e) => setForm({ ...form, pickupWindowEnd: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Количество пакетов</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            className="w-full border rounded-lg px-3 py-2"
            min={1}
            max={50}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Создаём...' : 'Создать сюрприз-пакет'}
        </button>
      </form>
    </div>
  )
}
