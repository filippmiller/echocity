import { MapPin, Phone, Globe, Mail, Star } from 'lucide-react'
import Link from 'next/link'

interface PlaceCardProps {
  place: {
    id: string
    title: string
    city: string
    address: string
    addressLine1?: string | null
    phone?: string | null
    placeType: string
    lat?: number | null
    lng?: number | null
    latitude?: number | null
    longitude?: number | null
    business?: {
      id: string
      name: string
      website?: string | null
      supportPhone?: string | null
      supportEmail?: string | null
    } | null
    services: Array<{
      id: string
      name?: string | null
      price?: any
      priceUnit: string
      isSpecial?: boolean
      specialPrice?: any
      specialTitle?: string | null
      specialDescription?: string | null
      specialValidUntil?: string | null
      serviceType: {
        name: string
        category: {
          name: string
        }
      }
    }>
  }
  averageRating: number | null
  reviewCount: number
}

export default function PlaceCard({
  place,
  averageRating,
  reviewCount,
}: PlaceCardProps) {
  const displayAddress = place.addressLine1 || place.address
  const displayPhone = place.business?.supportPhone || place.phone

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {place.title}
            </h1>
            {place.business && (
              <p className="text-lg text-gray-600 mb-2">{place.business.name}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {place.placeType}
              </span>
              {averageRating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-gray-500">
                    ({reviewCount} {reviewCount === 1 ? 'отзыв' : 'отзывов'})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-900 font-medium">{displayAddress}</p>
              <p className="text-sm text-gray-600">{place.city}</p>
            </div>
          </div>

          {displayPhone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <a
                href={`tel:${displayPhone}`}
                className="text-blue-600 hover:text-blue-700"
              >
                {displayPhone}
              </a>
            </div>
          )}

          {place.business?.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <a
                href={place.business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                {place.business.website}
              </a>
            </div>
          )}

          {place.business?.supportEmail && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <a
                href={`mailto:${place.business.supportEmail}`}
                className="text-blue-600 hover:text-blue-700"
              >
                {place.business.supportEmail}
              </a>
            </div>
          )}
        </div>

        {place.services.length > 0 && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Услуги</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {place.services.map((service: any) => {
                const isSpecial = service.isSpecial && 
                  (!service.specialValidUntil || new Date(service.specialValidUntil) > new Date())
                const displayPrice = isSpecial && service.specialPrice 
                  ? service.specialPrice 
                  : service.price
                const originalPrice = isSpecial && service.price ? service.price : null

                return (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 ${
                      isSpecial ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    {isSpecial && service.specialTitle && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-orange-500 text-white">
                          {service.specialTitle}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-500">
                          {service.serviceType.category.name}
                        </p>
                        <p className="font-medium text-gray-900">
                          {service.name || service.serviceType.name}
                        </p>
                        {isSpecial && service.specialDescription && (
                          <p className="text-xs text-gray-600 mt-1">
                            {service.specialDescription}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {displayPrice && (
                          <div>
                            {originalPrice && (
                              <span className="text-sm text-gray-400 line-through mr-2">
                                {typeof originalPrice === 'string'
                                  ? originalPrice
                                  : `${originalPrice} ₽`}
                              </span>
                            )}
                            <span className={`text-lg font-semibold ${
                              isSpecial ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                              {typeof displayPrice === 'string'
                                ? displayPrice
                                : `${displayPrice} ₽`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {service.priceUnit !== 'FIXED' && (
                      <p className="text-xs text-gray-500">
                        {service.priceUnit === 'PER_HOUR' && 'за час'}
                        {service.priceUnit === 'PER_ITEM' && 'за штуку'}
                        {service.priceUnit === 'PER_KG' && 'за кг'}
                        {service.priceUnit === 'PER_SQ_M' && 'за м²'}
                      </p>
                    )}
                    {isSpecial && service.specialValidUntil && (
                      <p className="text-xs text-orange-600 mt-2">
                        Акция действует до {new Date(service.specialValidUntil).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(place.lat && place.lng) || (place.latitude && place.longitude) ? (
          <div className="mt-6 border-t pt-6">
            <Link
              href={`/map?place=${place.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Показать на карте →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}

