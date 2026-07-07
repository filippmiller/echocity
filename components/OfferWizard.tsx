'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, AlertTriangle, Lightbulb, ArrowLeft } from 'lucide-react'
import { getOfferRecommendations, type OfferRecommendation } from '@/lib/offer-recommendations'
import type { OfferReachForecast } from '@/modules/analytics/offer-reach-forecast'

interface Branch {
  id: string
  title: string
  address: string
  city?: string
  businessType?: string
}

interface WizardProps {
  merchantId: string
  branches: Branch[]
}

interface CategoryData {
  id: string
  name: string
  slug: string
  icon: string | null
}

interface Template {
  id: string
  name: string
  icon: string
  niche: string
  defaults: {
    title: string
    offerType: string
    benefitType: string
    benefitValue: number
    visibility: string
    redemptionChannel: string
    termsText?: string
  }
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
  { value: 'FIXED_AMOUNT', label: 'Сумма скидки (₽)' },
  { value: 'FIXED_PRICE', label: 'Фикс. цена (₽)' },
  { value: 'FREE_ITEM', label: 'Бесплатный товар' },
  { value: 'BUNDLE', label: 'Комплект' },
]

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Все пользователи' },
  { value: 'MEMBERS_ONLY', label: 'Только подписчики' },
  { value: 'FREE_FOR_ALL', label: 'Бесплатный (оплата за использование)' },
]

const WEEKDAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const STEP_LABELS = ['Заведение и шаблон', 'Содержание и сроки', 'Проверка']

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

function formatDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getDefaultEndAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return formatDateTimeLocal(d)
}

export function OfferWizard({ merchantId, branches }: WizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [appliesToAll, setAppliesToAll] = useState(true)
  const [categoryMode, setCategoryMode] = useState<'allowed' | 'excluded'>('allowed')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(initScheduleRows)
  const [limits, setLimits] = useState<LimitsData>(initLimits)
  const [firstTimeOnly, setFirstTimeOnly] = useState(false)
  const [minCheck, setMinCheck] = useState<string>('')
  const [geoRadius, setGeoRadius] = useState<string>('')
  const [minPartySize, setMinPartySize] = useState<string>('')
  const [redemptionChannel, setRedemptionChannel] = useState<'IN_STORE' | 'ONLINE' | 'BOTH'>('IN_STORE')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [promoCode, setPromoCode] = useState('')

  const [categoryAverageDiscount, setCategoryAverageDiscount] = useState<number | undefined>(undefined)
  const [forecast, setForecast] = useState<OfferReachForecast & { viewRange: string | null; saveRange: string | null; redemptionRange: string | null } | null>(null)
  const [forecastLoading, setForecastLoading] = useState(false)

  const [form, setForm] = useState({
    branchId: branches[0]?.id || '',
    title: '',
    subtitle: '',
    description: '',
    offerType: 'PERCENT_DISCOUNT',
    visibility: 'PUBLIC',
    benefitType: 'PERCENT',
    benefitValue: 10,
    startAt: formatDateTimeLocal(new Date()),
    endAt: getDefaultEndAt(),
    termsText: '',
    imageUrl: '',
  })

  const branch = useMemo(() => branches.find((b) => b.id === form.branchId), [branches, form.branchId])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {})
  }, [])

  // Load competition insight for quality recommendations
  useEffect(() => {
    fetch('/api/business/analytics/competition')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.category?.avgDiscount) {
          setCategoryAverageDiscount(Number(d.category.avgDiscount))
        }
      })
      .catch(() => {})
  }, [])

  // Load reach forecast once key fields are filled
  useEffect(() => {
    if (!branch || !form.offerType || !form.benefitType || form.benefitValue <= 0) {
      setForecast(null)
      return
    }

    const city = branch.city?.trim() || branch.address?.split(',').pop()?.trim() || ''
    const params = new URLSearchParams({
      city,
      category: branch.businessType || '',
      offerType: form.offerType,
      benefitType: form.benefitType,
      benefitValue: String(form.benefitValue),
      merchantId,
    })

    setForecastLoading(true)
    fetch(`/api/business/offers/forecast?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.explanation === 'string') {
          setForecast(d)
        } else {
          setForecast(null)
        }
      })
      .catch(() => setForecast(null))
      .finally(() => setForecastLoading(false))
  }, [branch, form.offerType, form.benefitType, form.benefitValue, merchantId])

  // Load templates for the selected branch's business type
  useEffect(() => {
    if (!branch?.businessType) return
    setTemplatesLoading(true)
    fetch(`/api/business/offers/templates?niche=${encodeURIComponent(branch.businessType)}`)
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates ?? [])
        setSelectedTemplateId(null)
      })
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false))
  }, [branch?.businessType])

  const applyTemplate = (templateId: string | null) => {
    setSelectedTemplateId(templateId)
    if (!templateId) return
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    const value = template.defaults.benefitValue
    setForm((prev) => ({
      ...prev,
      title: template.defaults.title.replace('{value}', String(value)),
      offerType: template.defaults.offerType,
      benefitType: template.defaults.benefitType,
      benefitValue: value,
      visibility: template.defaults.visibility,
      termsText: template.defaults.termsText ?? prev.termsText,
    }))
    setRedemptionChannel((template.defaults.redemptionChannel as any) ?? 'IN_STORE')
  }

  const updateField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }))

  const updateScheduleRow = (index: number, patch: Partial<ScheduleRow>) => {
    setScheduleRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const updateLimit = (field: keyof LimitsData, value: string) => {
    const num = value === '' ? null : parseInt(value, 10)
    setLimits((prev) => ({ ...prev, [field]: isNaN(num as number) ? null : num }))
  }

  const recommendations: OfferRecommendation[] = useMemo(() => {
    return getOfferRecommendations({
      ...form,
      categoryAverageDiscount,
    })
  }, [form, categoryAverageDiscount])

  const buildPayload = () => {
    const enabledSchedules = scheduleRows
      .filter((r) => r.enabled)
      .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }))

    const rules: Array<{ ruleType: string; value: unknown }> = []
    if (!appliesToAll && selectedCategoryIds.length > 0) {
      rules.push({
        ruleType: categoryMode === 'allowed' ? 'ALLOWED_CATEGORIES' : 'EXCLUDED_CATEGORIES',
        value: { categoryIds: selectedCategoryIds },
      })
    }
    if (firstTimeOnly) rules.push({ ruleType: 'FIRST_TIME_ONLY', value: true })
    if (minCheck && Number(minCheck) > 0) rules.push({ ruleType: 'MIN_CHECK', value: Number(minCheck) })
    if (geoRadius && Number(geoRadius) > 0) rules.push({ ruleType: 'GEO_RADIUS', value: Number(geoRadius) })
    if (minPartySize && Number(minPartySize) > 0) rules.push({ ruleType: 'MIN_PARTY_SIZE', value: Number(minPartySize) })

    const limitsPayload: Record<string, number> = {}
    for (const [key, val] of Object.entries(limits)) {
      if (val !== null && val > 0) limitsPayload[key] = val
    }

    return {
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
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/business/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
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

  const canProceed = () => {
    if (step === 0) return !!form.branchId
    if (step === 1) return form.title.trim().length >= 3 && form.benefitValue > 0
    return true
  }

  // ============================
  // Labels
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

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  // ============================
  // Step content
  // ============================
  const stepContent = [
    // ---------- Step 0: Branch & Template ----------
    <div key="branch-template" className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Заведение</label>
        <select
          value={form.branchId}
          onChange={(e) => updateField('branchId', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm bg-white"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} — {b.address}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Выберите шаблон</label>
        {templatesLoading ? (
          <div className="grid grid-cols-2 gap-2 animate-pulse">
            <div className="h-14 bg-gray-200 rounded-lg" />
            <div className="h-14 bg-gray-200 rounded-lg" />
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-500">Нет шаблонов для этого типа заведения. Выберите «Свой вариант».</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyTemplate(null)}
              className={`p-3 text-left text-sm rounded-lg border transition-colors ${
                selectedTemplateId === null
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="block text-base mb-0.5">✨</span>
              <span className="font-medium">Свой вариант</span>
            </button>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className={`p-3 text-left text-sm rounded-lg border transition-colors ${
                  selectedTemplateId === t.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block text-base mb-0.5">{t.icon}</span>
                <span className="font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Шаблоны подбираются под тип заведения. После выбора вы сможете отредактировать любое поле.
        </p>
      </div>
    </div>,

    // ---------- Step 1: Content & Dates ----------
    <div key="content" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
        <input
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
          placeholder="Например: Скидка 20% на всё меню"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
        <input
          value={form.subtitle}
          onChange={(e) => updateField('subtitle', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
          placeholder="Каждый будний день"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
          rows={3}
          placeholder="Что входит в акцию и почему она выгодна"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип выгоды</label>
          <select
            value={form.benefitType}
            onChange={(e) => updateField('benefitType', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm bg-white"
          >
            {BENEFIT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Значение *</label>
          <input
            type="number"
            min={1}
            value={form.benefitValue}
            onChange={(e) => updateField('benefitValue', Number(e.target.value))}
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Тип предложения</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OFFER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => updateField('offerType', t.value)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                form.offerType === t.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Видимость</label>
        <select
          value={form.visibility}
          onChange={(e) => updateField('visibility', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm bg-white"
        >
          {VISIBILITY.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Начало *</label>
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => updateField('startAt', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Конец</label>
          <input
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => updateField('endAt', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Условия</label>
        <textarea
          value={form.termsText}
          onChange={(e) => updateField('termsText', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
          rows={2}
          placeholder="Время действия, ограничения, исключения"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL изображения</label>
        <input
          value={form.imageUrl}
          onChange={(e) => updateField('imageUrl', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
          placeholder="https://..."
        />
      </div>

      {/* Advanced settings */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Дополнительные настройки</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>

        {advancedOpen && (
          <div className="px-3 pb-4 space-y-5 border-t">
            {/* Schedule */}
            <div className="pt-3 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Расписание действия</h3>
              <p className="text-xs text-gray-500">Если ни один день не отмечен, предложение доступно в любое время.</p>
              {scheduleRows.map((row, idx) => (
                <div key={row.weekday} className="flex items-center gap-3 p-2 border rounded-lg">
                  <label className="flex items-center gap-2 min-w-[140px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateScheduleRow(idx, { enabled: e.target.checked })}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
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

            {/* Limits */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Лимиты использования</h3>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['dailyLimit', 'В день'],
                    ['weeklyLimit', 'В неделю'],
                    ['monthlyLimit', 'В месяц'],
                    ['totalLimit', 'Всего'],
                    ['perUserDailyLimit', 'На чел./день'],
                    ['perUserWeeklyLimit', 'На чел./нед.'],
                    ['perUserLifetimeLimit', 'На чел./всего'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className={key === 'perUserLifetimeLimit' ? 'col-span-2' : undefined}>
                    <label className="block text-xs text-gray-600 mb-1">{label}</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Без лимита"
                      value={limits[key] ?? ''}
                      onChange={(e) => updateLimit(key, e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Правила</h3>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={firstTimeOnly}
                  onChange={(e) => setFirstTimeOnly(e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Только первый визит</span>
                  <p className="text-xs text-gray-500">Пользователь может использовать предложение только один раз</p>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Мин. чек (₽)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Без минимума"
                    value={minCheck}
                    onChange={(e) => setMinCheck(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Гео-радиус (м)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Без ограничения"
                    value={geoRadius}
                    onChange={(e) => setGeoRadius(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Мин. кол-во гостей</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Без ограничения"
                    value={minPartySize}
                    onChange={(e) => setMinPartySize(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Channel */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Канал использования</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'IN_STORE', label: 'В заведении' },
                  { value: 'ONLINE', label: 'Онлайн' },
                  { value: 'BOTH', label: 'Оба' },
                ].map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setRedemptionChannel(ch.value as any)}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      redemptionChannel === ch.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
              {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
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
            </div>

            {/* Category restrictions */}
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
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">Скидка действует на все</span>
                  </label>
                  {!appliesToAll && (
                    <>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryMode('allowed')
                            setSelectedCategoryIds([])
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            categoryMode === 'allowed'
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          Только для категорий
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryMode('excluded')
                            setSelectedCategoryIds([])
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            categoryMode === 'excluded'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-600'
                          }`}
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
                                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                                    : 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {cat.icon ? `${cat.icon} ` : ''}
                              {cat.name}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,

    // ---------- Step 2: Preview & Recommendations ----------
    <div key="preview" className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Проверьте предложение</h3>

      <div className="border rounded-lg divide-y bg-white">
        <div className="p-3 space-y-1">
          <p className="text-base font-semibold text-gray-900">{form.title || '(без названия)'}</p>
          {form.subtitle && <p className="text-sm text-gray-600">{form.subtitle}</p>}
          {form.description && <p className="text-xs text-gray-500">{form.description}</p>}
        </div>

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
            <p className="text-gray-700 font-medium">
              {benefitTypeLabel(form.benefitType)}: {form.benefitValue}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Видимость</span>
            <p className="text-gray-700 font-medium">{visibilityLabel(form.visibility)}</p>
          </div>
        </div>

        <div className="p-3 text-xs">
          <span className="text-gray-400">Период</span>
          <p className="text-gray-700 font-medium">
            {form.startAt ? new Date(form.startAt).toLocaleString('ru-RU') : '—'}
            {form.endAt ? ` — ${new Date(form.endAt).toLocaleString('ru-RU')}` : ' — бессрочно'}
          </p>
        </div>

        {scheduleRows.some((r) => r.enabled) && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Расписание</span>
            <div className="mt-1 space-y-0.5">
              {scheduleRows
                .filter((r) => r.enabled)
                .map((r) => (
                  <p key={r.weekday} className="text-gray-700">
                    {WEEKDAY_NAMES[r.weekday]}: {r.startTime} — {r.endTime}
                  </p>
                ))}
            </div>
          </div>
        )}

        {Object.values(limits).some((v) => v !== null && v > 0) && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Лимиты</span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {limits.dailyLimit !== null && limits.dailyLimit > 0 && <p className="text-gray-700">В день: {limits.dailyLimit}</p>}
              {limits.weeklyLimit !== null && limits.weeklyLimit > 0 && <p className="text-gray-700">В неделю: {limits.weeklyLimit}</p>}
              {limits.monthlyLimit !== null && limits.monthlyLimit > 0 && <p className="text-gray-700">В месяц: {limits.monthlyLimit}</p>}
              {limits.totalLimit !== null && limits.totalLimit > 0 && <p className="text-gray-700">Всего: {limits.totalLimit}</p>}
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

        {(firstTimeOnly || (minCheck && Number(minCheck) > 0) || (geoRadius && Number(geoRadius) > 0) || (minPartySize && Number(minPartySize) > 0)) && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Правила</span>
            <div className="mt-1 space-y-0.5">
              {firstTimeOnly && <p className="text-gray-700">Только первый визит</p>}
              {minCheck && Number(minCheck) > 0 && <p className="text-gray-700">Мин. чек: {minCheck} ₽</p>}
              {geoRadius && Number(geoRadius) > 0 && <p className="text-gray-700">Гео-радиус: {geoRadius} м</p>}
              {minPartySize && Number(minPartySize) > 0 && <p className="text-gray-700">Мин. гостей: {minPartySize}</p>}
            </div>
          </div>
        )}

        <div className="p-3 text-xs">
          <span className="text-gray-400">Канал</span>
          <p className="text-gray-700 font-medium">{channelLabel(redemptionChannel)}</p>
          {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && onlineUrl && (
            <p className="text-gray-500 mt-0.5">URL: {onlineUrl}</p>
          )}
          {(redemptionChannel === 'ONLINE' || redemptionChannel === 'BOTH') && promoCode && (
            <p className="text-gray-500">
              Промокод: <span className="font-mono">{promoCode}</span>
            </p>
          )}
        </div>

        {!appliesToAll && selectedCategoryIds.length > 0 && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">{categoryMode === 'allowed' ? 'Только для категорий' : 'Исключены категории'}</span>
            <p className="text-gray-700 mt-0.5">
              {selectedCategoryIds
                .map((id) => categories.find((c) => c.id === id)?.name ?? id)
                .join(', ')}
            </p>
          </div>
        )}

        {form.termsText && (
          <div className="p-3 text-xs">
            <span className="text-gray-400">Условия</span>
            <p className="text-gray-700 mt-0.5">{form.termsText}</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Рекомендации</h4>
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                rec.type === 'warning'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              {rec.type === 'warning' ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{rec.message}</span>
            </div>
          ))}
        </div>
      )}

      {recommendations.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-50 border border-green-200 text-green-800">
          <Lightbulb className="w-4 h-4 shrink-0" />
          <span>Предложение выглядит отлично. Можно создавать!</span>
        </div>
      )}

      {/* Reach forecast */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Прогноз охвата</h4>
        {forecastLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
          </div>
        ) : !forecast ? (
          <p className="text-sm text-gray-500">
            Заполните тип выгоды и значение, чтобы увидеть прогноз.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Просмотры</p>
                <p className="text-lg font-bold text-gray-900">{forecast.viewRange ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Сохранения</p>
                <p className="text-lg font-bold text-brand-600">{forecast.saveRange ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Использования</p>
                <p className="text-lg font-bold text-deal-savings">{forecast.redemptionRange ?? '—'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{forecast.explanation}</p>
            <p className="text-xs text-gray-400">
              Достоверность:{' '}
              {forecast.confidence === 'high'
                ? 'высокая'
                : forecast.confidence === 'medium'
                  ? 'средняя'
                  : 'низкая (оценка приблизительная)'}
            </p>
          </div>
        )}
      </div>
    </div>,
  ]

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex gap-1.5 mb-2">
        {STEP_LABELS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-medium text-gray-900">{STEP_LABELS[step]}</p>
        <p className="text-xs text-gray-400">
          Шаг {step + 1} из {STEP_LABELS.length}
        </p>
      </div>

      {stepContent[step]}

      {error && <p className="text-red-600 text-sm mt-4 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      <div className="flex justify-between mt-6">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        ) : (
          <div />
        )}

        <div>
          {step < STEP_LABELS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Создание...' : 'Создать предложение'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
