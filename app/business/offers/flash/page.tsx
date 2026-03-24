'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FlashDealPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    branchId: '',
    title: '',
    benefitType: 'PERCENT' as string,
    benefitValue: 20,
    durationMinutes: 30,
    totalLimit: 10,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/business/offers/flash', {
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
      <h1 className="text-2xl font-bold mb-2">Скидка прямо сейчас!</h1>
      <p className="text-gray-500 text-sm mb-6">
        Создайте моментальную скидку — пользователи рядом получат уведомление
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
          <label className="block text-sm font-medium mb-1">Название скидки</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: -30% на все напитки"
            className="w-full border rounded-lg px-3 py-2"
            required
            minLength={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Тип скидки</label>
            <select
              value={form.benefitType}
              onChange={(e) => setForm({ ...form, benefitType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="PERCENT">Процент</option>
              <option value="FIXED_AMOUNT">Фиксированная сумма</option>
              <option value="FIXED_PRICE">Фиксированная цена</option>
              <option value="FREE_ITEM">Бесплатный товар</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Значение</label>
            <input
              type="number"
              value={form.benefitValue}
              onChange={(e) => setForm({ ...form, benefitValue: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2"
              min={1}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Длительность</label>
            <select
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value={15}>15 минут</option>
              <option value={30}>30 минут</option>
              <option value={60}>1 час</option>
              <option value={120}>2 часа</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Лимит</label>
            <input
              type="number"
              value={form.totalLimit}
              onChange={(e) => setForm({ ...form, totalLimit: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2"
              min={1}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Запускаем...' : 'Запустить скидку!'}
        </button>
      </form>
    </div>
  )
}
