'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WizardProps {
  merchantId: string
  branches: Array<{ id: string; title: string; address: string }>
}

const OFFER_TYPES = [
  { value: 'PERCENT_DISCOUNT', label: 'Скидка %' },
  { value: 'FIXED_PRICE', label: 'Фикс. цена' },
  { value: 'FREE_ITEM', label: 'Бесплатно' },
  { value: 'BUNDLE', label: 'Комплект' },
  { value: 'FIRST_VISIT', label: 'Первый визит' },
  { value: 'OFF_PEAK', label: 'Не в час пик' },
  { value: 'FLASH', label: 'Flash' },
]

const BENEFIT_TYPES = [
  { value: 'PERCENT', label: 'Процент скидки' },
  { value: 'FIXED_AMOUNT', label: 'Сумма скидки (коп.)' },
  { value: 'FIXED_PRICE', label: 'Фикс. цена (коп.)' },
  { value: 'FREE_ITEM', label: 'Бесплатный товар' },
  { value: 'BUNDLE', label: 'Комплект' },
]

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Все пользователи' },
  { value: 'MEMBERS_ONLY', label: 'Только подписчики' },
  { value: 'FREE_FOR_ALL', label: 'Бесплатный (оплата за использование)' },
]

export function OfferWizard({ merchantId, branches }: WizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    branchId: branches[0]?.id || '',
    title: '',
    subtitle: '',
    description: '',
    offerType: 'PERCENT_DISCOUNT',
    visibility: 'PUBLIC',
    benefitType: 'PERCENT',
    benefitValue: 10,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: '',
    termsText: '',
  })

  const updateField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/business/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId,
        ...form,
        benefitValue: Number(form.benefitValue),
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      }),
    })
    if (res.ok) {
      router.push('/business/offers')
    } else {
      const data = await res.json()
      setError(data.error || 'Ошибка создания')
    }
    setSubmitting(false)
  }

  const steps = [
    // Step 0: Type & Branch
    <div key="type" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Заведение</label>
        <select value={form.branchId} onChange={(e) => updateField('branchId', e.target.value)} className="w-full border rounded-lg p-2 text-sm">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.title} — {b.address}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Тип предложения</label>
        <div className="grid grid-cols-2 gap-2">
          {OFFER_TYPES.map((t) => (
            <button key={t.value} onClick={() => updateField('offerType', t.value)}
              className={`p-2 text-sm rounded-lg border ${form.offerType === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    // Step 1: Benefit & Visibility
    <div key="benefit" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Тип выгоды</label>
        <select value={form.benefitType} onChange={(e) => updateField('benefitType', e.target.value)} className="w-full border rounded-lg p-2 text-sm">
          {BENEFIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Значение</label>
        <input type="number" value={form.benefitValue} onChange={(e) => updateField('benefitValue', e.target.value)}
          className="w-full border rounded-lg p-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Видимость</label>
        <select value={form.visibility} onChange={(e) => updateField('visibility', e.target.value)} className="w-full border rounded-lg p-2 text-sm">
          {VISIBILITY.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
      </div>
    </div>,
    // Step 2: Details
    <div key="details" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
        <input value={form.title} onChange={(e) => updateField('title', e.target.value)}
          className="w-full border rounded-lg p-2 text-sm" placeholder="Скидка 20% на кофе" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
        <input value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)}
          className="w-full border rounded-lg p-2 text-sm" placeholder="Каждый будний день" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
        <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)}
          className="w-full border rounded-lg p-2 text-sm" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
          <input type="datetime-local" value={form.startAt} onChange={(e) => updateField('startAt', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Конец (опц.)</label>
          <input type="datetime-local" value={form.endAt} onChange={(e) => updateField('endAt', e.target.value)}
            className="w-full border rounded-lg p-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Условия</label>
        <textarea value={form.termsText} onChange={(e) => updateField('termsText', e.target.value)}
          className="w-full border rounded-lg p-2 text-sm" rows={2} />
      </div>
    </div>,
  ]

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex gap-1 mb-6">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {steps[step]}

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="flex justify-between mt-6">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="text-sm text-gray-600 hover:text-gray-900">Назад</button>
        )}
        <div className="ml-auto">
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
              Далее
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Создание...' : 'Создать'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
