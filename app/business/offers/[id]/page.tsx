'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'

interface OfferDetail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  offerType: string
  benefitType: string
  benefitValue: number
  visibility: string
  approvalStatus: string
  lifecycleStatus: string
  startAt: string
  endAt: string | null
  termsText: string | null
  imageUrl: string | null
  rejectionReason: string | null
  branch?: { title: string }
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'На модерации',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
  ACTIVE: 'Активно',
  PAUSED: 'На паузе',
  EXPIRED: 'Истекло',
  INACTIVE: 'Неактивно',
  SCHEDULED: 'Запланировано',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-orange-100 text-orange-800',
  EXPIRED: 'bg-gray-100 text-gray-500',
  INACTIVE: 'bg-gray-100 text-gray-500',
  SCHEDULED: 'bg-blue-100 text-blue-800',
}

function formatDateTimeLocal(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function BusinessOfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Partial<OfferDetail>>({})

  const canManage = Boolean(user && (user.role === 'BUSINESS_OWNER' || user.staffRole === 'MANAGER'))

  const loadOffer = async () => {
    try {
      const res = await fetch(`/api/offers/${id}`)
      if (!res.ok) {
        setOffer(null)
        return
      }
      const data = await res.json()
      setOffer(data.offer)
      setEditForm({
        title: data.offer.title,
        subtitle: data.offer.subtitle ?? '',
        description: data.offer.description ?? '',
        benefitValue: data.offer.benefitValue,
        startAt: data.offer.startAt,
        endAt: data.offer.endAt,
        termsText: data.offer.termsText ?? '',
        imageUrl: data.offer.imageUrl ?? '',
      })
    } catch {
      setOffer(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOffer()
  }, [id])

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/business/offers/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при копировании')
        return
      }
      const data = await res.json()
      toast.success('Предложение скопировано')
      router.push(`/business/offers/${data.offer.id}`)
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const handleSaveAndResubmit = async () => {
    setSaving(true)
    try {
      const patchRes = await fetch(`/api/business/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          startAt: editForm.startAt ? new Date(editForm.startAt).toISOString() : undefined,
          endAt: editForm.endAt ? new Date(editForm.endAt).toISOString() : undefined,
        }),
      })
      if (!patchRes.ok) {
        const data = await patchRes.json()
        toast.error(data.error || 'Ошибка сохранения')
        return
      }
      const submitRes = await fetch(`/api/business/offers/${id}/submit`, { method: 'POST' })
      if (!submitRes.ok) {
        const data = await submitRes.json()
        toast.error(data.error || 'Ошибка отправки')
        return
      }
      toast.success('Исправления отправлены на модерацию')
      await loadOffer()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Загрузка...</div>
  if (!offer) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-500">Предложение не найдено</div>

  const isRejected = offer.approvalStatus === 'REJECTED'
  const canResubmit = isRejected || offer.approvalStatus === 'DRAFT'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
        <div className="flex gap-1.5 shrink-0 ml-3">
          <span className={`px-2.5 py-1 rounded text-xs font-medium ${STATUS_COLORS[offer.approvalStatus] || ''}`}>
            {STATUS_LABELS[offer.approvalStatus] || offer.approvalStatus}
          </span>
          <span className={`px-2.5 py-1 rounded text-xs font-medium ${STATUS_COLORS[offer.lifecycleStatus] || ''}`}>
            {STATUS_LABELS[offer.lifecycleStatus] || offer.lifecycleStatus}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Тип:</span> {offer.offerType}
          </div>
          <div>
            <span className="text-gray-500">Выгода:</span> {offer.benefitType} — {Number(offer.benefitValue)}
          </div>
          <div>
            <span className="text-gray-500">Видимость:</span> {offer.visibility}
          </div>
          <div>
            <span className="text-gray-500">Заведение:</span> {offer.branch?.title}
          </div>
        </div>

        {offer.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Причина отклонения:</strong> {offer.rejectionReason}
            </p>
          </div>
        )}

        {offer.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Описание</h3>
            <p className="text-sm text-gray-600">{offer.description}</p>
          </div>
        )}

        {offer.termsText && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Условия</h3>
            <p className="text-sm text-gray-600">{offer.termsText}</p>
          </div>
        )}

        {canManage && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDuplicate}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Повторить
            </button>
            {canResubmit && (
              <button
                onClick={handleSaveAndResubmit}
                disabled={saving}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Отправка...' : isRejected ? 'Исправить и отправить' : 'Отправить на модерацию'}
              </button>
            )}
          </div>
        )}
      </div>

      {isRejected && canManage && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Что исправить?</h2>
          <p className="text-sm text-gray-500">Внесите правки по замечанию модератора и отправьте предложение повторно.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input
              value={editForm.title || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
            <input
              value={editForm.subtitle || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border rounded-lg p-2.5 text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Значение выгоды</label>
            <input
              type="number"
              min={1}
              value={editForm.benefitValue || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, benefitValue: Number(e.target.value) }))}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
              <input
                type="datetime-local"
                value={editForm.startAt ? formatDateTimeLocal(editForm.startAt) : ''}
                onChange={(e) => setEditForm((f) => ({ ...f, startAt: e.target.value }))}
                className="w-full border rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Конец</label>
              <input
                type="datetime-local"
                value={editForm.endAt ? formatDateTimeLocal(editForm.endAt) : ''}
                onChange={(e) => setEditForm((f) => ({ ...f, endAt: e.target.value }))}
                className="w-full border rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Условия</label>
            <textarea
              value={editForm.termsText || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, termsText: e.target.value }))}
              className="w-full border rounded-lg p-2.5 text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL изображения</label>
            <input
              value={editForm.imageUrl || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <button
            onClick={handleSaveAndResubmit}
            disabled={saving}
            className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Отправка...' : 'Сохранить исправления и отправить на модерацию'}
          </button>
        </div>
      )}
    </div>
  )
}
