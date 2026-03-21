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

interface ScheduleRow {
  enabled: boolean
  weekday: number
  startTime: string
  endTime: string
}

interface LimitsData {
  dailyLimit: number | null
  weeklyLimit: number | null
  monthlyLimit: number | null
  totalLimit: number | null
  perUserDailyLimit: number | null
  perUserWeeklyLimit: number | null
  perUserLifetimeLimit: number | null
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

const WEEKDAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const STEP_LABELS = [
  'Тип',
  'Выгода',
  'Детали',
  'Расписание',
  'Лимиты',
  'Правила',
  'Просмотр',
]

function initScheduleRows(): ScheduleRow[] {
  return Array.from({ length: 7 }, (_, i) => ({
    enabled: false,
    weekday: i,
    startTime: '09:00',
    endTime: '21:00',
  }))
}

function initLimits(): LimitsData {
  return {
    dailyLimit: null,
    weeklyLimit: null,
    monthlyLimit: null,
    totalLimit: null,
    perUserDailyLimit: null,
    perUserWeeklyLimit: null,
    perUserLifetimeLimit: null,
  }
}

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

  // Schedule state
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(initScheduleRows)

  // Limits state
  const [limits, setLimits] = useState<LimitsData>(initLimits)

  // Rules state
  const [firstTimeOnly, setFirstTimeOnly] = useState(false)
  const [minCheck, setMinCheck] = useState<string>('')
  const [geoRadius, setGeoRadius] = useState<string>('')
  const [minPartySize, setMinPartySize] = useState<string>('')
  const [redemptionChannel, setRedemptionChannel] = useState<'IN_STORE' | 'ONLINE' | 'BOTH'>('IN_STORE')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [promoCode, setPromoCode] = useState('')

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
    imageUrl: '',
  })

  const updateField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }))

  const updateScheduleRow = (index: number, patch: Partial<ScheduleRow>) => {
    setScheduleRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const updateLimit = (field: keyof LimitsData, value: string) => {
    const num = value === '' ? null : parseInt(value, 10)
    setLimits((prev) => ({ ...prev, [field]: isNaN(num as number) ? null : num }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {

    // Build schedules
    const enabledSchedules = scheduleRows
      .filter((r) => r.enabled)
      .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }))

    // Build rules
    const rules: Array<{ ruleType: string; value: unknown }> = []

    if (!appliesToAll && selectedCategoryIds.length > 0) {
      rules.push({
        ruleType: categoryMode === 'allowed' ? 'ALLOWED_CATEGORIES' : 'EXCLUDED_CATEGORIES',
        value: { categoryIds: selectedCategoryIds },
      })
    }

    if (firstTimeOnly) {
      rules.push({ ruleType: 'FIRST_TIME_ONLY', value: true })
    }
    if (minCheck && Number(minCheck) > 0) {
      rules.push({ ruleType: 'MIN_CHECK', value: Number(minCheck) })
    }
    if (geoRadius && Number(geoRadius) > 0) {
      rules.push({ ruleType: 'GEO_RADIUS', value: Number(geoRadius) })
    }
    if (minPartySize && Number(minPartySize) > 0) {
      rules.push({ ruleType: 'MIN_PARTY_SIZE', value: Number(minPartySize) })
    }

    // Build limits — only include non-null values
    const limitsPayload: Record<string, number> = {}
    for (const [key, val] of Object.entries(limits)) {
      if (val !== null && val > 0) {
        limitsPayload[key] = val
      }
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
        imageUrl: form.imageUrl || undefined,
        redemptionChannel,
        onlineUrl: onlineUrl || undefined,
        promoCode: promoCode || undefined,
        ...(enabledSchedules.length > 0 ? { schedules: enabledSchedules } : {}),
        ...(rules.length > 0 ? { rules } : {}),
        ...(Object.keys(limitsPayload).length > 0 ? { limits: limitsPayload } : {}),
      }),
    })
    if (res.ok) {
      router.push('/business/offers')
    } else {
      try {
        const data = await res.json()
        setError(data.error || 'Ошибка создания')
      } catch {
        setError(`Ошибка сервера (${res.status})`)
      }
    }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================
  // Helper: label for offer type
  // ============================
  const offerTypeLabel = (v: string) => OFFER_TYPES.find((t) => t.value === v)?.label ?? v
  const benefitTypeLabel = (v: string) => BENEFIT_TYPES.find((t) => t.value === v)?.label ?? v
  const visibilityLabel = (v: string) => VISIBILITY.find((t) => t.value === v)?.label ?? v
  const channelLabel = (v: string) => {
    if (v === 'IN_STORE') return 'В заведении'
    if (v === 'ONLINE') return 'Онлайн'
    return 'Оба канала'
  }
  const branchLabel = (id: string) => {
    const b = branches.find((br) => br.id === id)
    return b ? `${b.title} — ${b.address}` : id
  }

  const steps = [
    // ========== Step 0: Type & Branch ==========
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

    // ========== Step 1: Benefit & Visibility ==========
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

    // ========== Step 2: Details ==========
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL изображения (опц.)</label>
        <input value={form.imageUrl} onChange={(e) => updateField('imageUrl', e.target.value)}
          className="w-full border rounded-lg p-2 text-sm" placeholder="https://..." />
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

    // ========== Step 3: Schedule ==========
    <div key="schedule" className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">Расписание действия</h3>
        <p className="text-xs text-gray-500 mb-3">
          Если ни один день не отмечен, предложение доступно в любое время.
        </p>
      </div>

      <div className="space-y-2">
        {scheduleRows.map((row, idx) => (
          <div key={row.weekday} className="flex items-center gap-3 p-2 border rounded-lg">
            <label className="flex items-center gap-2 min-w-[140px] cursor-pointer">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => updateScheduleRow(idx, { enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm ${row.enabled ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {WEEKDAY_NAMES[idx]}
              </span>
            </label>

            {row.enabled && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateScheduleRow(idx, { startTime: e.target.value })}
                  className="border rounded-lg p-1.5 text-sm w-[110px]"
                />
                <span className="text-xs text-gray-400">—</span>
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateScheduleRow(idx, { endTime: e.target.value })}
                  className="border rounded-lg p-1.5 text-sm w-[110px]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {scheduleRows.some((r) => r.enabled) && (
        <p className="text-xs text-gray-500">
          Активных дней: {scheduleRows.filter((r) => r.enabled).length} из 7
        </p>
      )}
    </div>,

    // ========== Step 4: Limits ==========
    <div key="limits" className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">Лимиты использования</h3>
        <p className="text-xs text-gray-500 mb-3">
          Все поля необязательны. Пустое поле = без ограничений.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Общие лимиты</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">В день</label>
            <input
              type="number"
              min="1"
              placeholder="Без лимита"
              value={limits.dailyLimit ?? ''}
              onChange={(e) => updateLimit('dailyLimit', e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">В неделю</label>
            <input
              type="number"
              min="1"
              placeholder="Без лимита"
              value={limits.weeklyLimit ?? ''}
              onChange={(e) => updateLimit('weeklyLimit', e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">В месяц</label>
            <input
              type="number"
              min="1"
              placeholder="Без лимита"
              value={limits.monthlyLimit ?? ''}
              onChange={(e) => updateLimit('monthlyLimit', e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Всего за все время</label>
            <input
              type="number"
              min="1"
              placeholder="Без лимита"
              value={limits.totalLimit ?? ''}
              onChange={(e) => updateLimit('totalLimit', e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">На одного пользователя</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">В день</label>
            <input
              type="number"
              min="1"
              placeholder="Без лимита"
              value={limits.perUserDailyLimit ?? ''}
              onChange={(e) => updateLimit('perUserDailyLimit', e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">В неделю</label>
            <input
              type="number"
              min="1"
              placeholder="Без лимита"
              value={limits.perUserWeeklyLimit ?? ''}
              onChange={(e) => updateLimit('perUserWeeklyLimit', e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">За все время</label>
            <input
              type="number"
              min="1"
              placeholder="Без лимита"
              value={limits.perUserLifetimeLimit ?? ''}
              onChange={(e) => updateLimit('perUserLifetimeLimit', e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>,

    // ========== Step 5: Rules & Online ==========
    <div key="rules" className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">Правила и ограничения</h3>
        <p className="text-xs text-gray-500 mb-3">
          Дополнительные условия для использования предложения.
        </p>
      </div>

      {/* First time only toggle */}
      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
        <input
          type="checkbox"
          checked={firstTimeOnly}
          onChange={(e) => setFirstTimeOnly(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">Только первый визит</span>
          <p className="text-xs text-gray-500">Пользователь может использовать предложение только один раз</p>
        </div>
      </label>

      {/* MIN_CHECK */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Минимальный чек (руб.)</label>
        <input
          type="number"
          min="0"
          placeholder="Без минимума"
          value={minCheck}
          onChange={(e) => setMinCheck(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Предложение доступно от указанной суммы заказа</p>
      </div>

      {/* GEO_RADIUS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Гео-радиус (метры)</label>
        <input
          type="number"
          min="0"
          placeholder="Без ограничения"
          value={geoRadius}
          onChange={(e) => setGeoRadius(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Пользователь должен быть в указанном радиусе от заведения</p>
      </div>

      {/* MIN_PARTY_SIZE */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Мин. кол-во гостей</label>
        <input
          type="number"
          min="1"
          placeholder="Без ограничения"
          value={minPartySize}
          onChange={(e) => setMinPartySize(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm"
        />
      </div>

      {/* Redemption channel */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Канал использования</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'IN_STORE', label: 'В заведении' },
            { value: 'ONLINE', label: 'Онлайн' },
            { value: 'BOTH', label: 'Оба' },
          ] as const).map((ch) => (
            <button
              key={ch.value}
              type="button"
              onClick={() => setRedemptionChannel(ch.value)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                redemptionChannel === ch.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Online fields */}
      {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Онлайн-настройки</p>
          <div>
            <label className="block text-xs text-gray-600 mb-1">URL магазина / заказа</label>
            <input
              type="url"
              placeholder="https://shop.example.com"
              value={onlineUrl}
              onChange={(e) => setOnlineUrl(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Промокод</label>
            <input
              type="text"
              placeholder="SALE20"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm font-mono"
            />
          </div>
        </div>
      )}
    </div>,

    // ========== Step 6: Preview & Submit ==========
    <div key="preview" className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Проверьте предложение</h3>

      <div className="border rounded-lg divide-y">
        {/* Basic info */}
        <div className="p-3 space-y-1">
          <p className="text-base font-semibold text-gray-900">{form.title || '(без названия)'}</p>
          {form.subtitle && <p className="text-sm text-gray-600">{form.subtitle}</p>}
          {form.description && <p className="text-xs text-gray-500">{form.description}</p>}
        </div>

        {/* Type & branch */}
        <div className="p-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Заведение</span>
            <p className="text-gray-700 font-medium">{branchLabel(form.branchId)}</p>
          </div>
          <div>
            <span className="text-gray-400">Тип</span>
            <p className="text-gray-700 font-medium">{offerTypeLabel(form.offerType)}</p>
          </div>
          <div>
            <span className="text-gray-400">Выгода</span>
            <p className="text-gray-700 font-medium">{benefitTypeLabel(form.benefitType)}: {form.benefitValue}</p>
          </div>
          <div>
            <span className="text-gray-400">Видимость</span>
            <p className="text-gray-700 font-medium">{visibilityLabel(form.visibility)}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="p-3 text-xs">
          <span className="text-gray-400">Период</span>
          <p className="text-gray-700 font-medium">
            {form.startAt ? new Date(form.startAt).toLocaleString('ru-RU') : '—'}
            {form.endAt ? ` — ${new Date(form.endAt).toLocaleString('ru-RU')}` : ' — бессрочно'}
          </p>
        </div>

        {/* Schedule */}
        {scheduleRows.some((r) => r.enabled) && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Расписание</span>
            <div className="mt-1 space-y-0.5">
              {scheduleRows.filter((r) => r.enabled).map((r) => (
                <p key={r.weekday} className="text-gray-700">
                  {WEEKDAY_NAMES[r.weekday]}: {r.startTime} — {r.endTime}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Limits */}
        {Object.values(limits).some((v) => v !== null && v > 0) && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Лимиты</span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {limits.dailyLimit !== null && limits.dailyLimit > 0 && (
                <p className="text-gray-700">В день: {limits.dailyLimit}</p>
              )}
              {limits.weeklyLimit !== null && limits.weeklyLimit > 0 && (
                <p className="text-gray-700">В неделю: {limits.weeklyLimit}</p>
              )}
              {limits.monthlyLimit !== null && limits.monthlyLimit > 0 && (
                <p className="text-gray-700">В месяц: {limits.monthlyLimit}</p>
              )}
              {limits.totalLimit !== null && limits.totalLimit > 0 && (
                <p className="text-gray-700">Всего: {limits.totalLimit}</p>
              )}
              {limits.perUserDailyLimit !== null && limits.perUserDailyLimit > 0 && (
                <p className="text-gray-700">На чел./день: {limits.perUserDailyLimit}</p>
              )}
              {limits.perUserWeeklyLimit !== null && limits.perUserWeeklyLimit > 0 && (
                <p className="text-gray-700">На чел./нед.: {limits.perUserWeeklyLimit}</p>
              )}
              {limits.perUserLifetimeLimit !== null && limits.perUserLifetimeLimit > 0 && (
                <p className="text-gray-700">На чел./всего: {limits.perUserLifetimeLimit}</p>
              )}
            </div>
          </div>
        )}

        {/* Rules */}
        {(firstTimeOnly || (minCheck && Number(minCheck) > 0) || (geoRadius && Number(geoRadius) > 0) || (minPartySize && Number(minPartySize) > 0)) && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Правила</span>
            <div className="mt-1 space-y-0.5">
              {firstTimeOnly && <p className="text-gray-700">Только первый визит</p>}
              {minCheck && Number(minCheck) > 0 && <p className="text-gray-700">Мин. чек: {minCheck} руб.</p>}
              {geoRadius && Number(geoRadius) > 0 && <p className="text-gray-700">Гео-радиус: {geoRadius} м</p>}
              {minPartySize && Number(minPartySize) > 0 && <p className="text-gray-700">Мин. гостей: {minPartySize}</p>}
            </div>
          </div>
        )}

        {/* Channel */}
        <div className="p-3 text-xs">
          <span className="text-gray-400">Канал</span>
          <p className="text-gray-700 font-medium">{channelLabel(redemptionChannel)}</p>
          {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && onlineUrl && (
            <p className="text-gray-500 mt-0.5">URL: {onlineUrl}</p>
          )}
          {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && promoCode && (
            <p className="text-gray-500">Промокод: <span className="font-mono">{promoCode}</span></p>
          )}
        </div>

        {/* Categories */}
        {!appliesToAll && selectedCategoryIds.length > 0 && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">
              {categoryMode === 'allowed' ? 'Только для категорий' : 'Исключены категории'}
            </span>
            <p className="text-gray-700 mt-0.5">
              {selectedCategoryIds
                .map((id) => categories.find((c) => c.id === id)?.name ?? id)
                .join(', ')}
            </p>
          </div>
        )}

        {/* Terms */}
        {form.termsText && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Условия</span>
            <p className="text-gray-700 mt-0.5">{form.termsText}</p>
          </div>
        )}
      </div>
    </div>,
  ]

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator with labels */}
      <div className="flex gap-1 mb-2">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex justify-between mb-6">
        <p className="text-xs text-gray-500">{STEP_LABELS[step]}</p>
        <p className="text-xs text-gray-400">{step + 1} / {steps.length}</p>
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
