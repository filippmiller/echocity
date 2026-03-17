'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Pause, Package, MapPin, Tag } from 'lucide-react'

interface BundleItem {
  id: string
  itemTitle: string
  accepted: boolean
  place: { id: string; title: string; address: string }
  merchant: { id: string; name: string }
}

interface MerchantBundle {
  id: string
  title: string
  subtitle: string | null
  status: string
  totalPrice: number | null
  discountPercent: number | null
  validFrom: string
  validUntil: string | null
  items: BundleItem[]
  _count: { redemptions: number }
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-gray-100 text-gray-600' },
  PENDING_PARTNERS: { label: 'Ожидает партнёров', color: 'bg-amber-100 text-amber-700' },
  ACTIVE: { label: 'Активно', color: 'bg-green-100 text-green-700' },
  PAUSED: { label: 'Приостановлено', color: 'bg-yellow-100 text-yellow-700' },
  EXPIRED: { label: 'Истекло', color: 'bg-red-100 text-red-700' },
}

function formatPrice(kopecks: number): string {
  return Math.floor(kopecks / 100).toLocaleString('ru-RU') + ' \u20BD'
}

export default function BusinessBundlesPage() {
  const { user } = useAuth()
  const [bundles, setBundles] = useState<MerchantBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const loadBundles = () => {
    fetch('/api/business/bundles')
      .then((r) => r.json())
      .then((data) => { setBundles(data.bundles || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.role === 'BUSINESS_OWNER') loadBundles()
  }, [user])

  const handleAccept = async (bundleItemId: string) => {
    setAcceptingId(bundleItemId)
    try {
      const res = await fetch(`/api/business/bundles/${bundleItemId}/accept`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      toast.success('Участие подтверждено')
      loadBundles()
    } catch (err: any) {
      toast.error(err.message || 'Не удалось подтвердить')
    } finally {
      setAcceptingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Комбо-предложения</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32" />
          ))}
        </div>
      </div>
    )
  }

  const pendingBundles = bundles.filter((b) => b.status === 'PENDING_PARTNERS')
  const activeBundles = bundles.filter((b) => b.status === 'ACTIVE')
  const otherBundles = bundles.filter((b) => !['PENDING_PARTNERS', 'ACTIVE'].includes(b.status))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Комбо-предложения</h1>
      </div>

      {bundles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-4xl mb-4">&#x1F4E6;</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Нет комбо-предложений</h2>
          <p className="text-gray-500 text-sm">
            Когда администратор создаст комбо с вашим заведением, оно появится здесь
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending acceptance */}
          {pendingBundles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Ожидают подтверждения
              </h2>
              <div className="space-y-4">
                {pendingBundles.map((bundle) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    onAccept={handleAccept}
                    acceptingId={acceptingId}
                    showAcceptButton
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active */}
          {activeBundles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Активные
              </h2>
              <div className="space-y-4">
                {activeBundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            </div>
          )}

          {/* Other */}
          {otherBundles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Pause className="w-5 h-5 text-gray-400" />
                Прочие
              </h2>
              <div className="space-y-4">
                {otherBundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BundleCard({
  bundle,
  onAccept,
  acceptingId,
  showAcceptButton,
}: {
  bundle: MerchantBundle
  onAccept?: (id: string) => void
  acceptingId?: string | null
  showAcceptButton?: boolean
}) {
  const statusInfo = STATUS_MAP[bundle.status] || { label: bundle.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{bundle.title}</h3>
          {bundle.subtitle && <p className="text-sm text-gray-500">{bundle.subtitle}</p>}
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Discount info */}
      <div className="flex items-center gap-3 mb-3 text-sm">
        {bundle.discountPercent && (
          <span className="text-green-600 font-semibold">-{bundle.discountPercent}%</span>
        )}
        {bundle.totalPrice && (
          <span className="text-brand-600 font-semibold">{formatPrice(bundle.totalPrice)}</span>
        )}
        {bundle._count.redemptions > 0 && (
          <span className="text-gray-400 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {bundle._count.redemptions} использований
          </span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2 mb-3">
        {bundle.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate">{item.itemTitle}</p>
                <p className="text-xs text-gray-400 truncate">{item.place.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.accepted ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Принято
                </span>
              ) : (
                <>
                  <span className="text-xs text-amber-600 font-medium">Ожидает</span>
                  {showAcceptButton && onAccept && (
                    <button
                      onClick={() => onAccept(item.id)}
                      disabled={acceptingId === item.id}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {acceptingId === item.id ? '...' : 'Принять'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Validity */}
      <div className="text-xs text-gray-400">
        С {new Date(bundle.validFrom).toLocaleDateString('ru-RU')}
        {bundle.validUntil && <> по {new Date(bundle.validUntil).toLocaleDateString('ru-RU')}</>}
      </div>
    </div>
  )
}
