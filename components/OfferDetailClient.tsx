'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'
import { MapPin, Clock, Shield, ChevronLeft, Flag, Globe, Copy, Train, Users } from 'lucide-react'
import { ComplaintSheet } from '@/components/ComplaintSheet'
import { AuthPrompt } from '@/components/AuthPrompt'
import { useAuthPrompt } from '@/lib/useAuthPrompt'
import OfferReviews from '@/components/OfferReviews'
import { FavoriteButton } from '@/components/FavoriteButton'
import { SimilarOffers } from '@/components/SimilarOffers'
import { ShareButton } from '@/components/ShareButton'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import { GroupDealCard, type GroupDealData } from '@/components/GroupDealCard'
import { toast } from 'sonner'

export interface OfferDetail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  currency: string
  minOrderAmount: number | null
  maxDiscountAmount: number | null
  startAt: string
  endAt: string | null
  termsText: string | null
  imageUrl: string | null
  lifecycleStatus: string
  redemptionChannel?: string
  onlineUrl?: string | null
  promoCode?: string | null
  branch: { id: string; title: string; address: string; city: string; nearestMetro?: string | null }
  merchant: { id: string; name: string; isVerified?: boolean }
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>
  limits: { dailyLimit: number | null; totalLimit: number | null; perUserDailyLimit: number | null } | null
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getBenefitText(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `Скидка ${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return String(benefitValue)
  }
}

function getVisibilityLabel(visibility: string) {
  switch (visibility) {
    case 'FREE_FOR_ALL': return 'Бесплатно для всех'
    case 'MEMBERS_ONLY': return 'Только для подписчиков'
    case 'PUBLIC': return 'Для всех'
    default: return ''
  }
}

export function OfferDetailClient({ offer }: { offer: OfferDetail | null }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showComplaint, setShowComplaint] = useState(false)
  const { authPromptProps, showAuthPrompt } = useAuthPrompt()

  // Group deal state
  const [groupDeals, setGroupDeals] = useState<GroupDealData[]>([])
  const [groupLoading, setGroupLoading] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [showGroupSection, setShowGroupSection] = useState(false)

  // Load group deals for this offer
  const loadGroupDeals = useCallback(async (offerId: string) => {
    setGroupLoading(true)
    try {
      const res = await fetch(`/api/group-deals/by-offer/${offerId}`)
      if (res.ok) {
        const data = await res.json()
        setGroupDeals(data.groupDeals || [])
      }
    } catch {
      // silently fail
    } finally {
      setGroupLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!offer) return
    const groupParam = searchParams.get('group')
    if (groupParam) {
      setShowGroupSection(true)
    }
    loadGroupDeals(offer.id)
  }, [offer, searchParams, loadGroupDeals])

  const handleCreateGroup = useCallback(async () => {
    if (!user) {
      showAuthPrompt('Войдите, чтобы создать группу и пригласить друзей', `/offers/${offer?.id}`)
      return
    }
    if (!offer) return
    setCreatingGroup(true)
    try {
      const res = await fetch('/api/group-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось создать группу')
        return
      }
      setGroupDeals(prev => {
        const exists = prev.find(g => g.id === data.groupDeal.id)
        if (exists) return prev
        return [data.groupDeal, ...prev]
      })
      setShowGroupSection(true)
      toast.success('Группа создана! Поделитесь ссылкой с друзьями.')
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setCreatingGroup(false)
    }
  }, [user, offer, showAuthPrompt])

  const handleGroupUpdated = useCallback((updated: GroupDealData) => {
    setGroupDeals(prev => prev.map(g => g.id === updated.id ? updated : g))
  }, [])

  if (!offer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Предложение не найдено</h2>
        <p className="text-gray-500 mb-6">Возможно, оно было удалено или срок действия истёк</p>
        <Link href="/offers" className="text-brand-600 font-medium hover:underline">
          Все скидки &rarr;
        </Link>
      </div>
    )
  }

  const isMembersOnly = offer.visibility === 'MEMBERS_ONLY'
  const benefitText = getBenefitText(offer.benefitType, Number(offer.benefitValue))

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 min-h-0"
      >
        <ChevronLeft className="w-4 h-4" />
        Назад
      </button>

      {offer.imageUrl ? (
        <img src={offer.imageUrl} alt={offer.title} className="w-full h-56 md:h-72 object-cover rounded-xl mb-4" />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl mb-4 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-brand-600 opacity-30">{benefitText}</span>
          <span className="text-xs text-brand-400 mt-1">{offer.branch.title}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="bg-deal-discount text-white px-3 py-1.5 rounded-lg text-lg font-bold badge">
          {benefitText}
        </span>
        {isMembersOnly && (
          <span className="bg-deal-premium text-white px-2.5 py-1 rounded-lg text-sm font-semibold badge">
            Plus
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
        <div className="flex items-center gap-1 shrink-0 mt-1">
          <ShareButton
            title={offer.title}
            text={`Скидка в ${offer.merchant.name}!`}
            url={typeof window !== 'undefined' ? window.location.href : `/offers/${offer.id}`}
            variant="icon"
          />
          <FavoriteButton entityType="OFFER" entityId={offer.id} size="md" />
        </div>
      </div>
      {offer.subtitle && <p className="text-gray-600 mb-4">{offer.subtitle}</p>}

      <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-700">{offer.branch.title}</p>
          <p className="text-sm text-gray-500">{offer.branch.address}, {offer.branch.city}</p>
          {offer.branch.nearestMetro && (
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Train className="w-3 h-3 shrink-0" />
              {offer.branch.nearestMetro}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-xs text-gray-400">{offer.merchant.name}</p>
            {offer.merchant.isVerified && <VerifiedBadge size="md" />}
          </div>
        </div>
      </div>

      {offer.description && (
        <p className="text-gray-700 mb-4 leading-relaxed">{offer.description}</p>
      )}

      {offer.schedules.length > 0 && (() => {
        // Collapse identical schedules: if all 7 days have same time → "Ежедневно"
        const uniqueTimes = [...new Set(offer.schedules.map(s => `${s.startTime}-${s.endTime}`))]
        const isAllDay = uniqueTimes.length === 1 && uniqueTimes[0] === '00:00-23:59'
        const isEveryDay = offer.schedules.length === 7 && uniqueTimes.length === 1

        return (
          <div className="mb-4 bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-gray-700">Расписание</h3>
            </div>
            {isAllDay && isEveryDay ? (
              <span className="text-sm text-gray-600">Ежедневно, весь день</span>
            ) : isEveryDay ? (
              <span className="text-sm text-gray-600">Ежедневно {offer.schedules[0].startTime}–{offer.schedules[0].endTime}</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {offer.schedules.map((schedule, index) => (
                  <span key={index} className="text-xs bg-white px-2.5 py-1 rounded-full text-gray-600 border border-blue-100">
                    {WEEKDAYS[schedule.weekday]} {schedule.startTime}–{schedule.endTime}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {(offer.redemptionChannel === 'ONLINE' || offer.redemptionChannel === 'BOTH') && (
        <div className="mb-4 bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">Использовать онлайн</h3>
          </div>
          {offer.promoCode && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Промокод:</span>
              <code className="bg-white border border-blue-200 px-3 py-1 rounded-lg text-sm font-mono font-bold text-blue-700 select-all">
                {offer.promoCode}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(offer.promoCode!) }}
                className="text-blue-500 hover:text-blue-700 p-1"
                title="Скопировать"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
          {offer.onlineUrl && (
            <a
              href={offer.onlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Перейти на сайт &rarr;
            </a>
          )}
          {offer.redemptionChannel === 'BOTH' && (
            <p className="text-xs text-gray-500 mt-2">
              Также можно использовать в заведении.
            </p>
          )}
        </div>
      )}

      {offer.termsText && (
        <div className="mb-4 bg-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-700">Условия</h3>
          </div>
          <p className="text-sm text-gray-600">{offer.termsText}</p>
        </div>
      )}

      {offer.limits && (
        <div className="mb-4 text-sm text-gray-500 space-y-1">
          {offer.limits.dailyLimit && <p>Лимит на день: {offer.limits.dailyLimit} использований</p>}
          {offer.limits.perUserDailyLimit && <p>Для вас: {offer.limits.perUserDailyLimit} раз в день</p>}
        </div>
      )}

      {offer.minOrderAmount && (
        <p className="text-sm text-gray-500 mb-4">
          Минимальный заказ: {Math.round(Number(offer.minOrderAmount))}{'\u20BD'}
        </p>
      )}

      <p className="text-xs text-gray-400 mb-4">{getVisibilityLabel(offer.visibility)}</p>

      {user && (
        <button
          onClick={() => setShowComplaint(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <Flag className="w-3.5 h-3.5" />
          Пожаловаться
        </button>
      )}

      {showComplaint && (
        <ComplaintSheet
          offerId={offer.id}
          placeId={offer.branch.id}
          onClose={() => setShowComplaint(false)}
        />
      )}

      <SimilarOffers offerId={offer.id} />

      <div className="mb-6">
        <OfferReviews offerId={offer.id} />
      </div>

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:static md:border-0 md:p-0 z-40">
        <div className="max-w-2xl mx-auto">
          {!user ? (
            <div className="flex gap-3">
              <ShareButton
                title={offer.title}
                text={`Скидка в ${offer.merchant.name}!`}
                url={typeof window !== 'undefined' ? window.location.href : `/offers/${offer.id}`}
                variant="full"
                className="shrink-0"
              />
              <button
                onClick={() => showAuthPrompt('Войдите, чтобы активировать скидку и получить QR-код', `/offers/${offer.id}`)}
                className="flex-1 text-center bg-brand-600 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
                aria-busy={authLoading}
              >
                Войдите, чтобы активировать
              </button>
            </div>
          ) : isMembersOnly ? (
            <div className="space-y-2">
              <div className="flex gap-3">
                <ShareButton
                  title={offer.title}
                  text={`Скидка в ${offer.merchant.name}!`}
                  url={typeof window !== 'undefined' ? window.location.href : `/offers/${offer.id}`}
                  variant="full"
                  className="shrink-0"
                />
                <Link
                  href="/subscription"
                  className="flex-1 block text-center bg-deal-premium text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Подпишитесь для доступа
                </Link>
              </div>
              <p className="text-xs text-center text-gray-400">
                От 199 ₽/мес — 7 дней бесплатно
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3">
                <ShareButton
                  title={offer.title}
                  text={`Скидка в ${offer.merchant.name}!`}
                  url={typeof window !== 'undefined' ? window.location.href : `/offers/${offer.id}`}
                  variant="full"
                  className="shrink-0"
                />
                <button
                  onClick={() => router.push(`/offers/${offer.id}/redeem`)}
                  className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-lg"
                >
                  Активировать
                </button>
              </div>
              {/* "Пойдём вместе" button */}
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-200 text-brand-600 text-sm font-semibold hover:bg-brand-50 transition-colors disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                {creatingGroup ? 'Создаём группу...' : 'Пойдём вместе — +5% скидки'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group deal section */}
      {(showGroupSection || groupDeals.length > 0) && !isMembersOnly && (
        <div className="mt-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-gray-900">Пойдём вместе</h2>
            <span className="ml-auto text-xs text-gray-400">+{5}% при групповом погашении</span>
          </div>
          {groupLoading ? (
            <div className="text-sm text-gray-400 py-4 text-center">Загружаем группы...</div>
          ) : groupDeals.length === 0 ? (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-sm text-brand-700">
              <p className="font-semibold mb-1">Соберите компанию и получите дополнительную скидку</p>
              <p className="text-xs text-brand-500">Пригласите 2 друзей — все трое получат +5% к скидке при одновременном погашении.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupDeals.map(group => (
                <GroupDealCard
                  key={group.id}
                  groupDeal={group}
                  onJoined={handleGroupUpdated}
                  showOffer={false}
                />
              ))}
            </div>
          )}
          {!user && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Войдите, чтобы создать или присоединиться к группе
            </p>
          )}
        </div>
      )}

      <AuthPrompt {...authPromptProps} />
    </div>
  )
}
