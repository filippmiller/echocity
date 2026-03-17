'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Plus, Package, Play, Pause, XCircle, CheckCircle2, MapPin, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react'

// ─── Types ────────────────────────────────────────────

interface AdminBundleItem {
  id: string
  itemTitle: string
  itemValue: number | null
  accepted: boolean
  place: { id: string; title: string }
  merchant: { id: string; name: string }
}

interface AdminBundle {
  id: string
  title: string
  subtitle: string | null
  status: string
  totalPrice: number | null
  discountPercent: number | null
  validFrom: string
  validUntil: string | null
  createdBy: { firstName: string; email: string }
  items: AdminBundleItem[]
  _count: { redemptions: number }
}

interface SearchPlace {
  id: string
  title: string
  address: string
  city: string
  businessId: string | null
  business: { id: string; name: string } | null
}

interface DraftItem {
  placeId: string
  merchantId: string
  itemTitle: string
  itemValue: string
  placeName: string
  merchantName: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-gray-100 text-gray-600' },
  PENDING_PARTNERS: { label: 'Ожидает', color: 'bg-amber-100 text-amber-700' },
  ACTIVE: { label: 'Активно', color: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'Пауза', color: 'bg-yellow-100 text-yellow-700' },
  EXPIRED: { label: 'Истекло', color: 'bg-red-100 text-red-700' },
}

function formatPrice(kopecks: number): string {
  return Math.floor(kopecks / 100).toLocaleString('ru-RU') + ' \u20BD'
}

// ─── Main page ────────────────────────────────────────

export default function AdminBundlesPage() {
  const { user } = useAuth()
  const [bundles, setBundles] = useState<AdminBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const loadBundles = () => {
    const url = statusFilter
      ? `/api/admin/bundles?status=${statusFilter}`
      : '/api/admin/bundles'
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setBundles(data.bundles || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') loadBundles()
  }, [user, statusFilter])

  const handleAction = async (bundleId: string, action: string) => {
    setActionId(bundleId)
    try {
      const res = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      const actionLabel = action === 'activate' ? 'Активировано' : action === 'pause' ? 'Приостановлено' : 'Завершено'
      toast.success(actionLabel)
      loadBundles()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionId(null)
    }
  }

  if (user?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-gray-500">Нет доступа</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Комбо-предложения</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать комбо
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateBundleForm
          onCreated={() => { setShowCreate(false); loadBundles() }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Status filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { value: '', label: 'Все' },
          { value: 'ACTIVE', label: 'Активные' },
          { value: 'PENDING_PARTNERS', label: 'Ожидают' },
          { value: 'DRAFT', label: 'Черновики' },
          { value: 'PAUSED', label: 'На паузе' },
          { value: 'EXPIRED', label: 'Истекшие' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
              statusFilter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bundle list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-4xl mb-4">&#x1F4E6;</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Нет комбо</h2>
          <p className="text-gray-500 text-sm">Создайте первое комбо-предложение</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bundles.map((bundle) => (
            <AdminBundleCard
              key={bundle.id}
              bundle={bundle}
              onAction={handleAction}
              actionId={actionId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Bundle card ──────────────────────────────────────

function AdminBundleCard({
  bundle,
  onAction,
  actionId,
}: {
  bundle: AdminBundle
  onAction: (id: string, action: string) => void
  actionId: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const statusInfo = STATUS_MAP[bundle.status] || { label: bundle.status, color: 'bg-gray-100 text-gray-600' }
  const isLoading = actionId === bundle.id

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{bundle.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{bundle.items.length} заведений</span>
            {bundle.discountPercent && <span className="text-green-600 font-medium">-{bundle.discountPercent}%</span>}
            {bundle.totalPrice && <span className="text-brand-600 font-medium">{formatPrice(bundle.totalPrice)}</span>}
            <span>{bundle._count.redemptions} использований</span>
            <span>от {bundle.createdBy.firstName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Actions */}
          {bundle.status !== 'ACTIVE' && bundle.status !== 'EXPIRED' && (
            <button
              onClick={() => onAction(bundle.id, 'activate')}
              disabled={isLoading}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Активировать"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {bundle.status === 'ACTIVE' && (
            <button
              onClick={() => onAction(bundle.id, 'pause')}
              disabled={isLoading}
              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              title="Приостановить"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {bundle.status !== 'EXPIRED' && (
            <button
              onClick={() => onAction(bundle.id, 'expire')}
              disabled={isLoading}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Завершить"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {bundle.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate text-gray-700">{item.itemTitle}</span>
                <span className="text-xs text-gray-400">({item.merchant.name})</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.itemValue && (
                  <span className="text-xs text-gray-500">{formatPrice(item.itemValue)}</span>
                )}
                {item.accepted ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Ожидает</span>
                )}
              </div>
            </div>
          ))}
          <div className="text-xs text-gray-400 pt-1">
            С {new Date(bundle.validFrom).toLocaleDateString('ru-RU')}
            {bundle.validUntil && <> по {new Date(bundle.validUntil).toLocaleDateString('ru-RU')}</>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create form ──────────────────────────────────────

function CreateBundleForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState('')
  const [items, setItems] = useState<DraftItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Place search state
  const [placeQuery, setPlaceQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [itemTitle, setItemTitle] = useState('')
  const [itemValue, setItemValue] = useState('')

  const searchPlaces = async () => {
    if (placeQuery.length < 2) return
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/places/search?q=${encodeURIComponent(placeQuery)}&take=10`)
      const data = await res.json()
      setSearchResults(data.places || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(searchPlaces, 300)
    return () => clearTimeout(timer)
  }, [placeQuery])

  const addItem = (place: SearchPlace) => {
    if (!place.businessId || !place.business) {
      toast.error('У этого заведения нет бизнес-аккаунта')
      return
    }
    setItems([...items, {
      placeId: place.id,
      merchantId: place.businessId,
      itemTitle: itemTitle || place.title,
      itemValue: itemValue,
      placeName: place.title,
      merchantName: place.business.name,
    }])
    setPlaceQuery('')
    setSearchResults([])
    setItemTitle('')
    setItemValue('')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Укажите название'); return }
    if (items.length < 2) { toast.error('Добавьте минимум 2 заведения'); return }

    setSubmitting(true)
    try {
      const body = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        discountPercent: discountPercent ? Number(discountPercent) : undefined,
        totalPrice: totalPrice ? Number(totalPrice) * 100 : undefined,
        validFrom,
        validUntil: validUntil || undefined,
        items: items.map((item) => ({
          placeId: item.placeId,
          merchantId: item.merchantId,
          itemTitle: item.itemTitle,
          itemValue: item.itemValue ? Number(item.itemValue) * 100 : undefined,
        })),
      }

      const res = await fetch('/api/admin/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      toast.success('Комбо создано')
      onCreated()
    } catch (err: any) {
      toast.error(err.message || 'Не удалось создать')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Новое комбо</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Свидание: ужин + кино"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Идеальный вечер для двоих"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Подробное описание комбо-предложения..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Скидка %</label>
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            placeholder="25"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Или цена &#8381;</label>
          <input
            type="number"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            placeholder="2000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Начало *</label>
          <input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Конец</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Items section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Заведения в комбо</h3>

        {/* Added items */}
        {items.length > 0 && (
          <div className="space-y-2 mb-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{item.itemTitle}</p>
                  <p className="text-xs text-gray-400">{item.placeName} &middot; {item.merchantName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.itemValue && <span className="text-xs text-gray-500">{item.itemValue} &#8381;</span>}
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new item */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Поиск заведения..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {/* Search dropdown */}
              {placeQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {searching ? (
                    <div className="p-3 text-center text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                      Поиск...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-sm text-gray-400">Не найдено</div>
                  ) : (
                    searchResults.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => addItem(place)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <p className="font-medium text-gray-700">{place.title}</p>
                        <p className="text-xs text-gray-400">{place.address}, {place.city}
                          {place.business && <> &middot; {place.business.name}</>}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="Название пункта"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="number"
                value={itemValue}
                onChange={(e) => setItemValue(e.target.value)}
                placeholder="&#8381;"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Найдите заведение и кликните, чтобы добавить. Название пункта опционально (по умолчанию — название заведения).
          </p>
        </div>
      </div>

      {/* Submit / Cancel */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Создание...' : 'Создать комбо'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
