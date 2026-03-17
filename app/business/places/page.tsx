export const dynamic = 'force-dynamic'
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
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Мои заведения</h1>
        <Link
          href="/business/register"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors active:scale-[0.98]"
        >
          Добавить
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">У вас пока нет заведений</p>
          <Link
            href="/business/register"
            className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Зарегистрировать первое заведение
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business) => (
            <div key={business.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {business.name}
                    </h2>
                    {business.legalName && (
                      <p className="text-sm text-gray-500">{business.legalName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">Статус:</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          business.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : business.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {business.status === 'APPROVED'
                          ? 'Одобрено'
                          : business.status === 'PENDING'
                          ? 'На модерации'
                          : 'Отклонено'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <YandexBusinessVerification
                    businessId={business.id}
                    isVerified={!!business.yandexVerifiedAt}
                    yandexOrgName={business.yandexOrgName}
                  />
                </div>
              </div>

              {/* Places */}
              <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Точки ({business.places.length})
                </h3>
                {business.places.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Нет активных точек</p>
                ) : (
                  <div className="space-y-2">
                    {business.places.map((place) => (
                      <div
                        key={place.id}
                        className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {place.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {place.city}, {place.address}
                          </p>
                        </div>
                        <Link
                          href={`/business/places/${place.id}/services`}
                          className="shrink-0 ml-3 text-brand-600 hover:text-brand-700 text-sm font-medium"
                        >
                          Услуги
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
  )
}
