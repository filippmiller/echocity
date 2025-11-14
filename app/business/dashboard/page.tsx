import { redirect } from 'next/navigation'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function BusinessDashboardPage() {
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
    include: {
      places: {
        where: {
          isActive: true,
        },
        take: 5,
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

  const totalPlaces = businesses.reduce(
    (sum, biz) => sum + biz._count.places,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Панель управления бизнесом
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Бизнесов</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {businesses.length}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Точек</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalPlaces}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Статус</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {businesses.length > 0
                ? businesses[0].status === 'APPROVED'
                  ? 'Одобрено'
                  : 'На модерации'
                : '—'}
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Мои заведения</h2>
            <Link
              href="/business/places"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Все заведения →
            </Link>
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">У вас пока нет заведений</p>
              <Link
                href="/business/register"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
              >
                Зарегистрировать первое заведение
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {business.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {business._count.places} точек
                      </p>
                    </div>
                    <Link
                      href="/business/places"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Управлять →
                    </Link>
                  </div>
                  {business.places.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {business.places.map((place) => (
                        <div
                          key={place.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-700">{place.title}</span>
                          <Link
                            href={`/business/places/${place.id}/services`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Услуги →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

