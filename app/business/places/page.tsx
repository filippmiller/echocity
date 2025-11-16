import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import YandexBusinessVerification from '@/components/YandexBusinessVerification'

export default async function BusinessPlacesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.role !== 'BUSINESS_OWNER') {
    redirect('/')
  }

  // Get user's businesses and places
  const businesses = await prisma.business.findMany({
    where: {
      ownerId: session.userId,
    },
    select: {
      id: true,
      name: true,
      legalName: true,
      status: true,
      yandexVerifiedAt: true,
      yandexOrgName: true,
      places: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          places: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Мои заведения</h1>
          <Link
            href="/business/register"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Добавить заведение
          </Link>
        </div>

        {businesses.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">У вас пока нет заведений</p>
            <Link
              href="/business/register"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Зарегистрировать первое заведение
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {businesses.map((business) => (
              <div key={business.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {business.name}
                    </h2>
                    {business.legalName && (
                      <p className="text-sm text-gray-500">{business.legalName}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Статус:{' '}
                      <span
                        className={`font-medium ${
                          business.status === 'APPROVED'
                            ? 'text-green-600'
                            : business.status === 'PENDING'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {business.status === 'APPROVED'
                          ? 'Одобрено'
                          : business.status === 'PENDING'
                          ? 'На модерации'
                          : 'Отклонено'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 mb-4">
                  <YandexBusinessVerification
                    businessId={business.id}
                    isVerified={!!business.yandexVerifiedAt}
                    yandexOrgName={business.yandexOrgName}
                  />
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Точки ({business.places.length})
                  </h3>
                  {business.places.length === 0 ? (
                    <p className="text-sm text-gray-500">Нет точек</p>
                  ) : (
                    <div className="space-y-2">
                      {business.places.map((place) => (
                        <div
                          key={place.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {place.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {place.city}, {place.address}
                            </p>
                          </div>
                          <Link
                            href={`/business/places/${place.id}/services`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Управление услугами →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


