'use client'

import { useCallback, useEffect, useState } from 'react'
import { Heart, MapPin, Tag, X, Store, LogIn } from 'lucide-react'
import Link from 'next/link'
import { OfferCard } from '@/components/OfferCard'
import { useAuth } from '@/lib/auth-client'

type TabKey = 'OFFER' | 'PLACE'

interface FavoriteOffer {
  id: string
  title: string
  subtitle?: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl?: string | null
  lifecycleStatus: string
  endAt?: string | null
  branch: {
    id: string
    title: string
    address: string
    city: string
    placeType: string
  }
}

interface FavoritePlace {
  id: string
  title: string
  address: string
  city: string
  placeType: string
  phone?: string | null
  addressLine1?: string | null
  business?: { id: string; name: string } | null
}

interface FavoriteItem {
  id: string
  entityType: 'OFFER' | 'PLACE'
  entityId: string
  createdAt: string
  entity: FavoriteOffer | FavoritePlace | null
}

const tabs: { key: TabKey; label: string; icon: typeof Tag }[] = [
  { key: 'OFFER', label: 'Скидки', icon: Tag },
  { key: 'PLACE', label: 'Места', icon: Store },
]

function OfferSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )
}

function PlaceSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: TabKey }) {
  const isOffers = tab === 'OFFER'
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        isOffers ? 'bg-rose-50' : 'bg-blue-50'
      }`}>
        {isOffers ? (
          <Tag className="w-7 h-7 text-rose-300" />
        ) : (
          <Store className="w-7 h-7 text-blue-300" />
        )}
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        {isOffers ? 'Нет сохраненных скидок' : 'Нет сохраненных мест'}
      </h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {isOffers
          ? 'Нажимайте на сердечко на карточках скидок, чтобы сохранять лучшие предложения'
          : 'Добавляйте заведения в избранное, чтобы быстро находить их'}
      </p>
      <Link
        href={isOffers ? '/offers' : '/search'}
        className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
      >
        {isOffers ? 'Смотреть скидки' : 'Найти заведения'}
      </Link>
    </div>
  )
}

function placeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CAFE: 'Кафе',
    RESTAURANT: 'Ресторан',
    BAR: 'Бар',
    BEAUTY: 'Салон красоты',
    NAILS: 'Маникюр',
    HAIR: 'Парикмахерская',
    DRYCLEANING: 'Химчистка',
    OTHER: 'Услуги',
  }
  return map[type] || type
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('OFFER')
  const [favorites, setFavorites] = useState<Record<TabKey, FavoriteItem[]>>({
    OFFER: [],
    PLACE: [],
  })
  const [loading, setLoading] = useState<Record<TabKey, boolean>>({
    OFFER: true,
    PLACE: true,
  })
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const fetchFavorites = useCallback(async (type: TabKey) => {
    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      const res = await fetch(`/api/favorites?entityType=${type}`)
      if (res.ok) {
        const data = await res.json()
        setFavorites(prev => ({ ...prev, [type]: data.favorites }))
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }, [])

  useEffect(() => {
    fetchFavorites('OFFER')
    fetchFavorites('PLACE')
  }, [fetchFavorites])

  const removeFavorite = useCallback(async (entityType: TabKey, entityId: string) => {
    const key = `${entityType}-${entityId}`
    setRemovingIds(prev => new Set(prev).add(key))

    // Optimistic removal
    setFavorites(prev => ({
      ...prev,
      [entityType]: prev[entityType].filter(f => f.entityId !== entityId),
    }))

    try {
      await fetch(`/api/favorites/${entityType}/${entityId}`, { method: 'DELETE' })
    } catch {
      // Refetch on error
      fetchFavorites(entityType)
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [fetchFavorites])

  const currentItems = favorites[activeTab]
  const isLoading = loading[activeTab]

  // Guest state: show login prompt
  if (!authLoading && !user) {
    return (
      <div className="px-4 py-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Heart className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-bold text-gray-900">Избранное</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <LogIn className="w-9 h-9 text-brand-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Войдите в аккаунт</h2>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              Чтобы сохранять скидки и заведения в избранное, нужно войти или зарегистрироваться
            </p>
            <div className="flex gap-3">
              <Link
                href="/auth/login?redirect=/favorites"
                className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
              >
                Войти
              </Link>
              <Link
                href="/auth/register?redirect=/favorites"
                className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 pb-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Heart className="w-6 h-6 text-rose-500" />
          <h1 className="text-xl font-bold text-gray-900">Избранное</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key
            const count = favorites[tab.key].length
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {!loading[tab.key] && count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          activeTab === 'OFFER' ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <OfferSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <PlaceSkeleton key={i} />
              ))}
            </div>
          )
        ) : currentItems.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : activeTab === 'OFFER' ? (
          <div className="grid grid-cols-2 gap-3">
            {currentItems.map(fav => {
              const offer = fav.entity as FavoriteOffer | null
              if (!offer) return null
              return (
                <div key={fav.id} className="relative group">
                  <OfferCard
                    id={offer.id}
                    title={offer.title}
                    subtitle={offer.subtitle}
                    offerType={offer.offerType}
                    visibility={offer.visibility}
                    benefitType={offer.benefitType}
                    benefitValue={Number(offer.benefitValue)}
                    imageUrl={offer.imageUrl}
                    branchName={offer.branch.title}
                    branchAddress={offer.branch.address}
                    expiresAt={offer.endAt}
                  />
                  <button
                    onClick={() => removeFavorite('OFFER', offer.id)}
                    className="absolute top-1.5 right-1.5 z-20 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    aria-label="Удалить из избранного"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map(fav => {
              const place = fav.entity as FavoritePlace | null
              if (!place) return null
              return (
                <div key={fav.id} className="relative group">
                  <Link href={`/places/${place.id}`}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all active:scale-[0.99]">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6 text-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {place.title}
                          </h3>
                          {place.business && (
                            <p className="text-xs text-gray-500 truncate">{place.business.name}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{place.addressLine1 || place.address}</span>
                          </div>
                          <span className="inline-block mt-1.5 text-[11px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
                            {placeTypeLabel(place.placeType)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFavorite('PLACE', place.id)}
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-gray-100 hover:bg-rose-100 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-all"
                    aria-label="Удалить из избранного"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-rose-500" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
