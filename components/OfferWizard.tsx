'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface WizardProps {
  merchantId: string
  branches: Array<{ id: string; title: string; address: string }>
}

interface CategoryData {
  id: string
  name: string
  slug: string
  icon: string | null
  serviceTypes: Array<{ id: string; name: string; slug: string }>
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

  // Category restriction state
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [appliesToAll, setAppliesToAll] = useState(true)
  const [categoryMode, setCategoryMode] = useState<'allowed' | 'excluded'>('allowed')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {})
  }, [])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

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

    // Build category rules if restrictions are set
    const rules: Array<{ ruleType: string; value: unknown }> = []
    if (!appliesToAll && selectedCategoryIds.length > 0) {
      rules.push({
        ruleType: categoryMode === 'allowed' ? 'ALLOWED_CATEGORIES' : 'EXCLUDED_CATEGORIES',
        value: { categoryIds: selectedCategoryIds },
      })
    }

    const res = await fetch('/api/business/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId,
        ...form,
        benefitValue: Number(form.benefitValue),
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        ...(rules.length > 0 ? { rules } : {}),
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

      {/* Category restrictions - collapsible */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Ограничения по категориям</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
        </button>

        {categoriesOpen && (
          <div className="px-3 pb-3 space-y-3 border-t">
            <label className="flex items-center gap-2 pt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={appliesToAll}
                onChange={(e) => {
                  setAppliesToAll(e.target.checked)
                  if (e.target.checked) setSelectedCategoryIds([])
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Скидка действует на все</span>
            </label>

            {!appliesToAll && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setCategoryMode('allowed'); setSelectedCategoryIds([]) }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${categoryMode === 'allowed' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    Только для категорий
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCategoryMode('excluded'); setSelectedCategoryIds([]) }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${categoryMode === 'excluded' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    Не действует на
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          isSelected
                            ? categoryMode === 'allowed'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </button>
                    )
                  })}
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-400">Нет доступных категорий</p>
                  )}
                </div>

                {selectedCategoryIds.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {categoryMode === 'allowed' ? 'Скидка только для: ' : 'Не действует на: '}
                    {selectedCategoryIds.length} кат.
                  </p>
                )}
              </>
            )}
          </div>
        )}
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
